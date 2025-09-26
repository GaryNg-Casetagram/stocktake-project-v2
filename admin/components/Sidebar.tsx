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
  UsersIcon,
  ChevronRightIcon,
  BellIcon,
  QuestionMarkCircleIcon
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
    { name: 'Home', href: '/home', icon: HomeIcon, description: 'Dashboard overview' },
    { name: 'StockTake', href: '/stocktake', icon: ClipboardDocumentListIcon, description: 'Inventory sessions' },
    { name: 'Locations', href: '/locations', icon: BuildingOfficeIcon, description: 'Stores & warehouses' },
    { name: 'Items', href: '/items', icon: CubeIcon, description: 'Product catalog' },
    { name: 'Users', href: '/users', icon: UsersIcon, superadminOnly: true, description: 'User management' },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, description: 'Data insights' },
    { name: 'Reports', href: '/reports', icon: PresentationChartLineIcon, description: 'Generate reports' },
    { name: 'Settings', href: '/settings', icon: CogIcon, description: 'System settings' },
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
        fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-white to-gray-50 shadow-xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-8 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">StockTake</h1>
                <p className="text-xs text-gray-500">Inventory Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="px-8 py-6 border-b border-gray-200 bg-white">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-lg">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex space-x-2">
              <button className="flex-1 flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <BellIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button className="flex-1 flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <QuestionMarkCircleIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-6 space-y-1 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main Menu</h3>
            </div>
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
                    group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md hover:transform hover:scale-105'
                    }
                  `}
                  onClick={onClose}
                >
                  <item.icon className={`w-5 h-5 mr-4 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-600'}`}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && <ChevronRightIcon className="w-4 h-4 text-white" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-4 text-gray-500 group-hover:text-red-500" />
              <span>Sign Out</span>
            </button>
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-400">StockTake v2.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
