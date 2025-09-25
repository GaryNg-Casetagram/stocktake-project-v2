import React from 'react';
import { useQuery } from 'react-query';
import { 
  HomeIcon,
  BuildingOfficeIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const HomeDashboard: React.FC = () => {
  // Fetch dashboard data
  const { data: locationsData } = useQuery(
    'locations',
    async () => {
      const response = await fetch('http://localhost:3005/api/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    }
  );

  const { data: itemsData } = useQuery(
    'items',
    async () => {
      const response = await fetch('http://localhost:3005/api/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    }
  );

  const { data: sessionsData } = useQuery(
    'sessions',
    async () => {
      const response = await fetch('http://localhost:3005/api/sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    }
  );

  const locations = locationsData?.data || [];
  const items = itemsData?.data || [];
  const sessions = sessionsData?.data || [];

  const activeSessions = sessions.filter((session: any) => session.status === 'active');
  const completedSessions = sessions.filter((session: any) => session.status === 'completed');

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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome to StockTake</h1>
            <p className="text-blue-100 mt-2">
              Your comprehensive inventory management dashboard
            </p>
          </div>
          <div className="hidden md:block">
            <HomeIcon className="h-16 w-16 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
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
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-100">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Start New Session</p>
                  <p className="text-xs text-gray-500">Begin inventory counting</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-green-100">
                  <CubeIcon className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Add New Item</p>
                  <p className="text-xs text-gray-500">Add inventory item</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-purple-100">
                  <BuildingOfficeIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Add Location</p>
                  <p className="text-xs text-gray-500">Create store or warehouse</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <ChartBarIcon className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">View Analytics</p>
                  <p className="text-xs text-gray-500">Check system metrics</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
            <span className="text-sm text-gray-700">API Server: Online</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
            <span className="text-sm text-gray-700">Database: Connected</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
            <span className="text-sm text-gray-700">Last Sync: 2 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
