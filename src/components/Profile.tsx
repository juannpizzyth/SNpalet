import { useState } from 'react';
import { User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileProps {
  onNavigate?: (page: string) => void;
}

export default function Profile({ onNavigate }: ProfileProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors text-gray-700"
      >
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white">
          <User className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium max-w-[200px] truncate">{user?.email}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-600">Logged in as</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
          </div>

          <div className="px-4 py-3 space-y-2 text-sm text-gray-600">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Account Status</p>
              <p className="text-green-600 font-medium">Active</p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowDropdown(false);
              if (onNavigate) {
                onNavigate('edit-profile');
              }
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Edit Profile</span>
          </button>

          <button
            onClick={() => {
              setShowDropdown(false);
              handleLogout();
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      )}

      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
