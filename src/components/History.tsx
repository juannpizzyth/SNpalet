import { useState, useEffect } from 'react';
import { FolderOpen, CheckCircle2, XCircle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ScanHistory } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface HistoryStats {
  totalFolders: number;
  totalScans: number;
  failedScans: number;
}

interface GroupedHistory {
  [date: string]: ScanHistory[];
}

export default function History() {
  const [stats, setStats] = useState<HistoryStats>({
    totalFolders: 0,
    totalScans: 0,
    failedScans: 0,
  });
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory>({});
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user, selectedMonth]);

  const loadHistory = async () => {
    try {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('scan_history')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user?.id)
        .gte('scan_date', startOfMonth.toISOString().split('T')[0])
        .lte('scan_date', endOfMonth.toISOString().split('T')[0])
        .order('scanned_at', { ascending: false });

      if (error) throw error;

      const grouped: GroupedHistory = {};
      data?.forEach((item) => {
        const date = item.scan_date;
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(item);
      });

      setGroupedHistory(grouped);
      setStats({
        totalFolders: Object.keys(grouped).length,
        totalScans: data?.length || 0,
        failedScans: 0,
      });
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const changeMonth = (delta: number) => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage scan palet dengan grouping berdasarkan tanggal</h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border-4 border-red-600 rounded-lg p-4 flex items-start gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <FolderOpen className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Total Folder</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFolders}</p>
            </div>
          </div>

          <div className="bg-white border-4 border-red-600 rounded-lg p-4 flex items-start gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Total Scan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalScans}</p>
            </div>
          </div>

          <div className="bg-white border-4 border-red-600 rounded-lg p-4 flex items-start gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Fail Txt</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failedScans}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendar
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronDown className="w-5 h-5 transform rotate-90" />
            </button>
            <span className="text-gray-900 font-medium min-w-[150px] text-center">
              {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronDown className="w-5 h-5 transform -rotate-90" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {Object.keys(groupedHistory).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No scan history for this month
            </div>
          ) : (
            Object.entries(groupedHistory).map(([date, scans]) => (
              <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleDate(date)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-red-600 p-2 rounded-lg">
                      <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{formatDate(date)}</p>
                      <p className="text-sm text-gray-500">{scans.length} scan</p>
                    </div>
                  </div>
                  {expandedDates.has(date) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedDates.has(date) && (
                  <div className="border-t border-gray-200 bg-white">
                    {scans.map((scan) => (
                      <div key={scan.id} className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">
                                SN: {scan.serial_number}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                scan.scan_method === 'camera' ? 'bg-blue-100 text-blue-700' :
                                scan.scan_method === 'manual' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {scan.scan_method}
                              </span>
                            </div>
                            {scan.products && (
                              <p className="text-sm text-gray-600 mb-1">
                                {scan.products.product_name}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {formatTime(scan.scanned_at)}
                            </p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-red-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
