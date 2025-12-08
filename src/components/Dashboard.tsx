import { useEffect, useState } from 'react';
import { Package, ScanLine, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalProducts: number;
  todayScans: number;
  totalScans: number;
  recentScans: Array<{
    serial_number: string;
    product_name: string;
    scanned_at: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    todayScans: 0,
    totalScans: 0,
    recentScans: [],
  });
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('scan_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('scan_date', today);

      const { count: totalCount } = await supabase
        .from('scan_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      const { data: recentData } = await supabase
        .from('scan_history')
        .select(`
          serial_number,
          scanned_at,
          products (product_name)
        `)
        .eq('user_id', user?.id)
        .order('scanned_at', { ascending: false })
        .limit(5);

      setStats({
        totalProducts: productCount || 0,
        todayScans: todayCount || 0,
        totalScans: totalCount || 0,
        recentScans: recentData?.map(item => ({
          serial_number: item.serial_number,
          product_name: item.products?.product_name || 'Unknown',
          scanned_at: item.scanned_at,
        })) || [],
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Pallet Scanner Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-4 border-red-600 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-red-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-red-600 opacity-80" />
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Total Products</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
        </div>

        <div className="bg-white border-4 border-red-600 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <ScanLine className="w-6 h-6 text-red-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-red-600 opacity-80" />
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Today's Scans</p>
          <p className="text-3xl font-bold text-gray-900">{stats.todayScans}</p>
        </div>

        <div className="bg-white border-4 border-red-600 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <ScanLine className="w-6 h-6 text-red-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-red-600 opacity-80" />
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Total Scans</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalScans}</p>
        </div>

        <div className="bg-white border-4 border-red-600 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-red-600 opacity-80" />
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Recent Activity</p>
          <p className="text-3xl font-bold text-gray-900">{stats.recentScans.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h2>

        {stats.recentScans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No scans yet. Start scanning to see history.
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentScans.map((scan, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 p-2 rounded-lg">
                    <ScanLine className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">SN: {scan.serial_number}</p>
                    <p className="text-sm text-gray-600">{scan.product_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{formatTime(scan.scanned_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
