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
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  XCircleIcon,
  TagIcon,
  CalendarIcon,
  MapPinIcon
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

  // Session status counts
  const activeSessions = sessions.filter((session: any) => session.status === 'active');
  const completedSessions = sessions.filter((session: any) => session.status === 'completed');
  const pausedSessions = sessions.filter((session: any) => session.status === 'paused');
  const cancelledSessions = sessions.filter((session: any) => session.status === 'cancelled');

  // Calculate timestamp ranges
  const getTimestampRange = (sessions: any[]) => {
    if (sessions.length === 0) return { earliest: null, latest: null };
    
    const timestamps = sessions
      .map(s => new Date(s.startedAt || s.createdAt))
      .filter(date => !isNaN(date.getTime()));
    
    if (timestamps.length === 0) return { earliest: null, latest: null };
    
    const earliest = new Date(Math.min(...timestamps.map(d => d.getTime())));
    const latest = new Date(Math.max(...timestamps.map(d => d.getTime())));
    
    return { earliest, latest };
  };

  const activeRange = getTimestampRange(activeSessions);
  const completedRange = getTimestampRange(completedSessions);

  // Total SKU count
  const totalSKUs = items.length;
  const uniqueSKUs = new Set(items.map((item: any) => item.sku)).size;

  // Location status with active sessions and session counts
  const getLocationStatus = (location: any) => {
    const locationSessions = sessions.filter((session: any) => 
      session.storeId === location.id || session.warehouseId === location.id
    );
    
    const activeLocationSessions = locationSessions.filter((session: any) => 
      session.status === 'active' || session.status === 'paused'
    );
    
    // Count sessions by status
    const sessionCounts = {
      total: locationSessions.length,
      active: locationSessions.filter(s => s.status === 'active').length,
      completed: locationSessions.filter(s => s.status === 'completed').length,
      paused: locationSessions.filter(s => s.status === 'paused').length,
      cancelled: locationSessions.filter(s => s.status === 'cancelled').length
    };
    
    if (activeLocationSessions.length > 0) {
      const session = activeLocationSessions[0];
      return {
        status: session.status,
        sessionName: session.name,
        startedAt: session.startedAt,
        type: session.type,
        sessionCounts
      };
    }
    
    return { 
      status: 'idle', 
      sessionName: null, 
      startedAt: null, 
      type: null,
      sessionCounts
    };
  };

  const locationsWithStatus = locations.map((location: any) => ({
    ...location,
    statusInfo: getLocationStatus(location)
  }));

  // Map session types to better descriptions
  const getSessionTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'retail': 'Stocktake',
      'warehouse': 'Cycle Count',
      'inventory': 'Inventory Count',
      'audit': 'Audit Count',
      'recount': 'Recount',
      'spot': 'Spot Check',
      'full': 'Full Count',
      'partial': 'Partial Count'
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

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
      change: `${locations.filter((l: any) => l.isActive).length} active`,
      changeType: 'positive'
    },
    {
      name: 'Total SKUs',
      value: totalSKUs,
      icon: TagIcon,
      color: 'bg-green-500',
      change: `${uniqueSKUs} unique`,
      changeType: 'positive'
    },
    {
      name: 'Active Sessions',
      value: activeSessions.length,
      icon: ClipboardDocumentListIcon,
      color: 'bg-yellow-500',
      change: activeSessions.length > 0 ? 'In Progress' : 'None',
      changeType: activeSessions.length > 0 ? 'positive' : 'neutral'
    },
    {
      name: 'Completed Sessions',
      value: completedSessions.length,
      icon: CheckCircleIcon,
      color: 'bg-purple-500',
      change: pausedSessions.length > 0 ? `${pausedSessions.length} paused` : 'All done',
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

      {/* Session Status Overview */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center">
          <ClipboardDocumentListIcon className="w-5 h-5 mr-2 text-blue-600" />
          Session Status Overview
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-green-900">{completedSessions.length}</p>
            <p className="text-xs text-green-700">Completed</p>
            {completedRange.earliest && (
              <p className="text-xs text-green-600 mt-1">
                {completedRange.earliest.toLocaleDateString()} - {completedRange.latest.toLocaleDateString()}
              </p>
            )}
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-lg font-semibold text-yellow-900">{activeSessions.length}</p>
            <p className="text-xs text-yellow-700">Active</p>
            {activeRange.earliest && (
              <p className="text-xs text-yellow-600 mt-1">
                Started: {activeRange.earliest.toLocaleDateString()}
              </p>
            )}
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <PauseIcon className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-lg font-semibold text-orange-900">{pausedSessions.length}</p>
            <p className="text-xs text-orange-700">Paused</p>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <XCircleIcon className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-lg font-semibold text-red-900">{cancelledSessions.length}</p>
            <p className="text-xs text-red-700">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Location Status List */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center">
          <MapPinIcon className="w-5 h-5 mr-2 text-blue-600" />
          Location Status & Session Activity
        </h3>
        <div className="space-y-3">
          {locationsWithStatus.map((location: any) => {
            const getStatusColor = (status: string) => {
              switch (status) {
                case 'active': return 'bg-green-100 text-green-800 border-green-200';
                case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                case 'idle': return 'bg-gray-100 text-gray-800 border-gray-200';
                default: return 'bg-gray-100 text-gray-800 border-gray-200';
              }
            };

            const getStatusIcon = (status: string) => {
              switch (status) {
                case 'active': return <ClockIcon className="w-4 h-4" />;
                case 'paused': return <PauseIcon className="w-4 h-4" />;
                case 'idle': return <CheckCircleIcon className="w-4 h-4" />;
                default: return <CheckCircleIcon className="w-4 h-4" />;
              }
            };

            return (
              <div key={location.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {location.type === 'store' ? '🏪' : '🏭'}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{location.name}</h4>
                      <p className="text-xs text-gray-500">{location.type.charAt(0).toUpperCase() + location.type.slice(1)} • {location.manager}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(location.statusInfo.status)}`}>
                    {getStatusIcon(location.statusInfo.status)}
                    <span className="ml-1 capitalize">{location.statusInfo.status}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Session Counts */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Sessions:</span>
                      <div className="flex items-center space-x-1">
                        {location.statusInfo.sessionCounts.total > 0 ? (
                          <>
                            <span className="text-xs font-medium text-gray-900">{location.statusInfo.sessionCounts.total}</span>
                            <span className="text-xs text-gray-400">total</span>
                            {location.statusInfo.sessionCounts.completed > 0 && (
                              <>
                                <span className="text-xs text-green-600">•</span>
                                <span className="text-xs text-green-600">{location.statusInfo.sessionCounts.completed} completed</span>
                              </>
                            )}
                            {location.statusInfo.sessionCounts.active > 0 && (
                              <>
                                <span className="text-xs text-yellow-600">•</span>
                                <span className="text-xs text-yellow-600">{location.statusInfo.sessionCounts.active} active</span>
                              </>
                            )}
                            {location.statusInfo.sessionCounts.paused > 0 && (
                              <>
                                <span className="text-xs text-orange-600">•</span>
                                <span className="text-xs text-orange-600">{location.statusInfo.sessionCounts.paused} paused</span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No sessions</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {location.statusInfo.sessionName ? (
                      <div>
                        <p className="text-xs font-medium text-gray-900">{location.statusInfo.sessionName}</p>
                        <p className="text-xs text-gray-500">
                          {getSessionTypeLabel(location.statusInfo.type)} • {location.statusInfo.startedAt ? 
                            new Date(location.statusInfo.startedAt).toLocaleDateString() : 'Unknown'
                          }
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No active session</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
                  <p className="text-xs text-gray-500">Stocktake/Cycle Count</p>
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
