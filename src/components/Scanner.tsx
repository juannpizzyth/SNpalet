import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle2, AlertCircle, Search, Trash2, Plus } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Scanner {
  id: string;
  scanner_name: string;
  scanner_type: string;
  device_info?: string;
  is_active: boolean;
  created_at: string;
}

export default function Scanner() {
  const [cameraActive, setCameraActive] = useState(false);
  const [manualSN, setManualSN] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [scanners, setScanners] = useState<Scanner[]>([]);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerSearchInput, setScannerSearchInput] = useState('');
  const [loadingScanners, setLoadingScanners] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadScanners();
    }
  }, [user]);

  const loadScanners = async () => {
    if (!user) return;
    try {
      setLoadingScanners(true);
      const { data } = await supabase
        .from('scanners')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false, nullsFirst: false });

      if (data) {
        setScanners(data as Scanner[]);
      }
    } catch (err) {
      console.error('Error loading scanners:', err);
    } finally {
      setLoadingScanners(false);
    }
  };

  const searchScannerInfo = async (searchName: string) => {
    if (!searchName.trim()) return;

    try {
      const { data } = await supabase
        .from('scanners')
        .select('*')
        .eq('user_id', user?.id)
        .ilike('scanner_name', `%${searchName}%`)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setScanners(data as Scanner[]);
        setScannerSearchInput('');
      } else {
        setError(`Scanner "${searchName}" not found`);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error searching scanner:', err);
      setError('Failed to search scanner');
    }
  };

  const deleteScannerInfo = async (scannerId: string) => {
    if (!confirm('Are you sure you want to delete this scanner? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('scanners')
        .delete()
        .eq('id', scannerId)
        .eq('user_id', user?.id);

      if (deleteError) throw deleteError;

      setScanners(scanners.filter(s => s.id !== scannerId));
      setError('');
    } catch (err) {
      console.error('Error deleting scanner:', err);
      setError('Failed to delete scanner');
    }
  };

  const registerCurrentScanner = async () => {
    if (!user) return;

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString(),
      };

      const scannerName = `Camera-${new Date().toLocaleDateString()}`;

      const { error: insertError } = await supabase
        .from('scanners')
        .upsert({
          user_id: user.id,
          scanner_name: scannerName,
          scanner_type: 'camera',
          device_info: JSON.stringify(deviceInfo),
          is_active: true,
          last_used_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      await loadScanners();
      setShowScannerModal(false);
    } catch (err) {
      console.error('Error registering scanner:', err);
      setError('Failed to register scanner');
    }
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      setScanStatus('idle');
      setError('');

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      }

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        throw new Error('No cameras found on this device');
      }

      const cameraId = cameras[cameras.length - 1].id;

      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          setScanStatus('detecting');
          setTimeout(() => {
            if (decodedText.trim()) {
              searchProduct(decodedText.trim());
            }
          }, 300);
        },
        () => {
          // Do nothing on scan failure
        }
      );

      await registerCurrentScanner();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes('camera') || errorMessage.includes('permission') || errorMessage.includes('Permission denied')) {
        setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (errorMessage.includes('No cameras')) {
        setError('No camera found on this device. Please check your device has a working camera.');
      } else {
        setError('Failed to access camera. Please check your permissions and device settings.');
      }

      setCameraActive(false);
      console.error('Camera error:', err);
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
    } catch (err) {
      console.log('Error stopping camera:', err);
    }
    setCameraActive(false);
    setScanStatus('idle');
  };

  const searchProduct = async (serialNumber: string) => {
    try {
      const { data, error: searchError } = await supabase
        .from('products')
        .select('*')
        .eq('serial_number', serialNumber)
        .maybeSingle();

      if (searchError) throw searchError;

      if (data) {
        setScannedProduct(data);
        setScanStatus('success');
        await saveScanHistory(serialNumber, 'camera');
        setTimeout(() => {
          setScanStatus('idle');
        }, 2000);
      } else {
        setScanStatus('error');
        setError('Produk tidak ditemukan di database');
        setScannedProduct(null);
        setTimeout(() => {
          setScanStatus('idle');
        }, 2000);
      }
    } catch (err) {
      setScanStatus('error');
      setError('Error searching product');
      console.error('Search error:', err);
    }
  };

  const saveScanHistory = async (serialNumber: string, method: 'camera' | 'manual' | 'excel') => {
    if (!user) return;

    try {
      await supabase.from('scan_history').insert({
        user_id: user.id,
        serial_number: serialNumber,
        scan_method: method,
      });
    } catch (err) {
      console.error('Error saving scan history:', err);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSN.trim()) {
      searchProduct(manualSN.trim());
      setManualSN('');
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch((err) => {
          console.log('Error stopping scanner on unmount:', err);
        });
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Scanner QR/Barcode</h2>
          <button
            onClick={() => setShowScannerModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
          >
            <Search className="w-4 h-4" />
            Manage Scanners
          </button>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden w-full">
          {!cameraActive ? (
            <div className="flex flex-col items-center justify-center w-full py-20 bg-gray-900">
              <Camera className="w-24 h-24 text-gray-600 mb-6" />
              <p className="text-gray-400 mb-6 text-center text-lg">Kamera belum aktif<br />Tekan tombol di bawah untuk mulai scanning</p>
              <button
                onClick={startCamera}
                className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-lg font-bold transition-colors flex items-center gap-3 text-lg shadow-lg"
              >
                <Camera className="w-7 h-7" />
                Mulai Scan Barcode
              </button>
            </div>
          ) : (
            <div className="relative">
              <div id="qr-reader" className="w-full"></div>

              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={stopCamera}
                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-colors shadow-lg"
                  title="Stop Camera"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {scanStatus === 'detecting' && (
                <div className="absolute top-4 left-4 bg-yellow-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg animate-pulse z-10">
                  <AlertCircle className="w-6 h-6" />
                  <span>Detecting...</span>
                </div>
              )}

              {scanStatus === 'success' && (
                <div className="absolute top-4 left-4 bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg animate-bounce z-10">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Barcode Detected!</span>
                </div>
              )}

              {scanStatus === 'error' && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg z-10">
                  <AlertCircle className="w-6 h-6" />
                  <span>Product Not Found</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Input Manual Serial Number</h2>

        <form onSubmit={handleManualSearch} className="flex gap-2">
          <input
            type="text"
            value={manualSN}
            onChange={(e) => setManualSN(e.target.value)}
            placeholder="Masukkan Serial Number"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-base"
          />
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold transition-colors"
          >
            Cari
          </button>
        </form>
      </div>

      {scannedProduct && (
        <div className="bg-white rounded-lg shadow-sm p-6 border-4 border-red-600">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Detail Produk</h2>
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Terverifikasi
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b-2 border-gray-200">
              <span className="text-gray-600 font-bold text-base">Serial Number:</span>
              <span className="text-gray-900 font-bold text-base">{scannedProduct.serial_number}</span>
            </div>

            <div className="flex justify-between py-3 border-b-2 border-gray-200">
              <span className="text-gray-600 font-bold text-base">Nama Produk:</span>
              <span className="text-gray-900 text-right font-semibold">{scannedProduct.product_name}</span>
            </div>

            <div className="flex justify-between py-3 border-b-2 border-gray-200">
              <span className="text-gray-600 font-bold text-base">Kode Produk:</span>
              <span className="text-gray-900 font-semibold">{scannedProduct.product_code}</span>
            </div>

            <div className="flex justify-between py-3 border-b-2 border-gray-200">
              <span className="text-gray-600 font-bold text-base">Kemasan:</span>
              <span className="text-gray-900 font-semibold">{scannedProduct.packaging}</span>
            </div>

            <div className="flex justify-between py-3 border-b-2 border-gray-200">
              <span className="text-gray-600 font-bold text-base">Production Order:</span>
              <span className="text-gray-900 font-semibold">{scannedProduct.production_order}</span>
            </div>

            <div className="flex justify-between py-3 border-b-2 border-gray-200">
              <span className="text-gray-600 font-bold text-base">Tanggal Produksi:</span>
              <span className="text-gray-900 font-semibold">
                {new Date(scannedProduct.production_date).toLocaleDateString('id-ID')} {scannedProduct.production_time}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b-2 border-gray-200">
              <span className="text-gray-600 font-bold text-base">Lokasi:</span>
              <span className="text-gray-900 font-semibold">{scannedProduct.location}</span>
            </div>

            <div className="flex justify-between py-3">
              <span className="text-gray-600 font-bold text-base">Status:</span>
              <span className="text-red-600 font-bold text-base">Unverified</span>
            </div>
          </div>
        </div>
      )}

      {error && !scannedProduct && (
        <div className="bg-red-50 border-2 border-red-200 text-red-600 px-6 py-4 rounded-lg font-semibold">
          {error}
        </div>
      )}

      {showScannerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Manage Scanners</h3>
              <button
                onClick={() => setShowScannerModal(false)}
                className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scannerSearchInput}
                  onChange={(e) => setScannerSearchInput(e.target.value)}
                  placeholder="Search scanner by name..."
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      searchScannerInfo(scannerSearchInput);
                    }
                  }}
                />
                <button
                  onClick={() => searchScannerInfo(scannerSearchInput)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>

              {loadingScanners ? (
                <p className="text-gray-600 text-center py-8">Loading scanners...</p>
              ) : scanners.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No scanners registered yet</p>
              ) : (
                <div className="space-y-4">
                  {scanners.map((scanner) => (
                    <div key={scanner.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{scanner.scanner_name}</p>
                        <p className="text-sm text-gray-600">Type: {scanner.scanner_type}</p>
                        <p className="text-sm text-gray-600">Created: {new Date(scanner.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                      <button
                        onClick={() => deleteScannerInfo(scanner.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-colors flex items-center gap-2"
                        title="Delete Scanner"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowScannerModal(false)}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
