import { ReactNode, useState } from 'react';
import { LayoutDashboard, ScanLine, History, FileText, User } from 'lucide-react';
import Profile from './Profile';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [showSidebar, setShowSidebar] = useState(false);

  const sidebarMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'scanner', icon: ScanLine, label: 'Scanner' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'reports', icon: FileText, label: 'Reports' },
    { id: 'edit-profile', icon: User, label: 'Edit Profile' },
  ];

  const mobileMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'scanner', icon: ScanLine, label: 'Scanner' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'reports', icon: FileText, label: 'Reports' },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setShowSidebar(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white shadow-md border-b-4 border-red-600 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="flex items-center hover:opacity-80 transition-opacity"
              title="Toggle Menu"
            >
              <img src="/image copy.png" alt="PERTAMINA LUBRICANTS" className="h-12" />
            </button>

            <Profile onNavigate={handleNavigate} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`fixed left-0 top-20 h-[calc(100vh-80px)] w-64 bg-red-600 shadow-lg transform transition-transform duration-300 z-30 ${
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="overflow-y-auto h-full">
            <nav className="space-y-2 p-4">
              {sidebarMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-semibold text-white text-left ${
                      isActive ? 'bg-red-700 bg-opacity-80' : 'hover:bg-red-700 hover:bg-opacity-40'
                    }`}
                  >
                    <Icon className="w-6 h-6 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {showSidebar && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 top-20"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <main className="flex-1 overflow-auto w-full bg-gray-50">
          <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      <nav className="md:hidden bg-white border-t-4 border-red-600 sticky bottom-0 z-30">
        <div className="flex overflow-x-auto">
          {mobileMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 px-4 py-3 ${
                  isActive
                    ? 'text-red-600 border-t-4 border-red-600'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
