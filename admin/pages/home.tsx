import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import { 
  HomeIcon,
  BuildingOfficeIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const HomeDashboard: React.FC = () => {
  const router = useRouter();
  const { token, isAuthenticated, initializeAuth, isSessionValid, logout } = useAuthStore();

  // Check authentication and session validity on component mount
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }
    
    // Check if session is still valid
    if (!isSessionValid()) {
      logout();
      router.push('/login');
      return;
    }
    
    initializeAuth();
  }, [router, isAuthenticated, token, isSessionValid, logout, initializeAuth]);

  // Check session validity periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSessionValid()) {
        logout();
        router.push('/login');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isSessionValid, logout, router]);

  // Fetch dashboard data
  const { data: locationsData } = useQuery(
    'locations',
    async () => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch('http://localhost:3005/api/locations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
    {
      enabled: !!token && isAuthenticated && isSessionValid(),
    }
  );

  const { data: itemsData } = useQuery(
    'items',
    async () => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch('http://localhost:3005/api/items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    },
    {
      enabled: !!token && isAuthenticated && isSessionValid(),
    }
  );

  const { data: sessionsData } = useQuery(
    'sessions',
    async () => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch('http://localhost:3005/api/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    {
      enabled: !!token && isAuthenticated && isSessionValid(),
    }
  );

  const locations = locationsData?.data || [];
  const items = itemsData?.data || [];
  const sessions = sessionsData?.data || [];

  const activeSessions = sessions.filter((session: any) => session.status === 'active');
  const completedSessions = sessions.filter((session: any) => session.status === 'completed');

  // Quick action handlers
  const handleStartSession = () => {
    router.push('/stocktake');
  };

  const handleAddItem = () => {
    router.push('/items');
  };

  const handleAddLocation = () => {
    router.push('/locations');
  };

  const handleViewAnalytics = () => {
    router.push('/analytics');
  };

  const stats = [
    {
      name: 'Total Locations',
      value: locations.length,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
      change: '+2',
      changeType: 'positive'
    },
    {
      name: 'Total Items',
      value: items.length,
      icon: CubeIcon,
      color: 'bg-green-500',
      change: '+5',
      changeType: 'positive'
    },
    {
      name: 'Active Sessions',
      value: activeSessions.length,
      icon: ClipboardDocumentListIcon,
      color: 'bg-yellow-500',
      change: activeSessions.length > 0 ? 'Active' : 'None',
      changeType: activeSessions.length > 0 ? 'positive' : 'neutral'
    },
    {
      name: 'Completed Sessions',
      value: completedSessions.length,
      icon: CheckCircleIcon,
      color: 'bg-purple-500',
      change: '+1',
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome to StockTake</h1>
            <p className="text-blue-100 mt-1 text-sm">
              Your comprehensive inventory management dashboard
            </p>
          </div>
          <div className="hidden md:block">
            <HomeIcon className="h-12 w-12 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-xs font-medium text-gray-600">{stat.name}</p>
                <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                <p className={`text-xs ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-base font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button 
              onClick={handleStartSession}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors group"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <ClipboardDocumentListIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-900">Start Session</p>
                  <p className="text-xs text-gray-500">Begin counting</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={handleAddItem}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors group"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                  <CubeIcon className="w-4 h-4 text-green-600" />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-900">Add Item</p>
                  <p className="text-xs text-gray-500">New inventory</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={handleAddLocation}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors group"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <BuildingOfficeIcon className="w-4 h-4 text-purple-600" />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-900">Add Location</p>
                  <p className="text-xs text-gray-500">Store/warehouse</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={handleViewAnalytics}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors group"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-yellow-100 group-hover:bg-yellow-200 transition-colors">
                  <ChartBarIcon className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-500">View metrics</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-base font-medium text-gray-900 mb-3">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span className="text-xs text-gray-700">API Server: Online</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span className="text-xs text-gray-700">Database: Connected</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span className="text-xs text-gray-700">Last Sync: 2 minutes ago</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-base font-medium text-gray-900 mb-3">Recent Activity</h3>
        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-600">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
            <span>New location "Main Warehouse" added</span>
            <span className="ml-auto text-gray-400">2 hours ago</span>
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
            <span>5 new items imported via CSV</span>
            <span className="ml-auto text-gray-400">4 hours ago</span>
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2"></div>
            <span>StockTake session "Q4 Inventory" completed</span>
            <span className="ml-auto text-gray-400">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
