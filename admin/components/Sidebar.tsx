import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  CubeIcon, 
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const navigation = [
    { name: 'Home', href: '/home', icon: HomeIcon },
    { name: 'StockTake', href: '/stocktake', icon: ClipboardDocumentListIcon },
    { name: 'Locations', href: '/locations', icon: BuildingOfficeIcon },
    { name: 'Items', href: '/items', icon: CubeIcon },
    { name: 'Users', href: '/users', icon: UsersIcon, superadminOnly: true },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Reports', href: '/reports', icon: PresentationChartLineIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-8 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">StockTake</h1>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="px-8 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-6 space-y-2">
            {navigation.map((item) => {
              // Only show superadmin-only items to superadmin users
              if (item.superadminOnly && user?.role !== 'superadmin') {
                return null;
              }
              
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={onClose}
                >
                  <item.icon className="w-5 h-5 mr-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
