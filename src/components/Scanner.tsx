import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function Scanner() {
  const [cameraActive, setCameraActive] = useState(false);
  const [manualSN, setManualSN] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { user } = useAuth();

  const startCamera = async () => {
    try {
      setCameraActive(true);
      setScanStatus('idle');
      setError('');

      if (!qrScannerRef.current) {
        const qrScanner = new Html5QrcodeScanner(
          'qr-scanner-container',
          {
            fps: 10,
            qrbox: { width: 300, height: 300 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [],
          },
          false
        );

        qrScannerRef.current = qrScanner;

        qrScanner.render(
          (decodedText) => {
            setScanStatus('detecting');
            setTimeout(() => {
              if (decodedText.trim()) {
                searchProduct(decodedText.trim());
              }
            }, 300);
          },
          (error) => {
            console.log('QR Scanner error:', error);
          }
        );
      }
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
      setCameraActive(false);
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.clear().catch((err) => {
        console.log('Error clearing scanner:', err);
      });
      qrScannerRef.current = null;
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
      if (qrScannerRef.current) {
        qrScannerRef.current.clear().catch((err) => {
          console.log('Error clearing scanner on unmount:', err);
        });
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Scanner QR/Barcode - Arahkan ke Kamera</h2>

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
            <>
              <div id="qr-scanner-container" className="w-full" style={{ minHeight: '600px' }} />

              <div className="absolute top-4 right-4">
                <button
                  onClick={stopCamera}
                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-colors shadow-lg"
                  title="Stop Camera"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {scanStatus === 'detecting' && (
                <div className="absolute top-4 left-4 bg-yellow-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg animate-pulse">
                  <AlertCircle className="w-6 h-6" />
                  <span>Detecting...</span>
                </div>
              )}

              {scanStatus === 'success' && (
                <div className="absolute top-4 left-4 bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg animate-bounce">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Barcode Detected!</span>
                </div>
              )}

              {scanStatus === 'error' && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg">
                  <AlertCircle className="w-6 h-6" />
                  <span>Product Not Found</span>
                </div>
              )}
            </>
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
    </div>
  );
}
