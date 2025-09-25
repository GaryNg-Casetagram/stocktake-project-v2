import React from 'react';
import { 
  ClipboardDocumentListIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const StockTakePage: React.FC = () => {
  const sessions = [
    {
      id: 'session-demo-1',
      name: 'Demo Session 1',
      type: 'retail',
      status: 'active',
      storeId: 'store-1',
      warehouseId: 'warehouse-1',
      createdBy: '1',
      startedAt: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-15T10:30:00Z',
      metadata: {}
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayIcon className="w-4 h-4" />;
      case 'paused':
        return <PauseIcon className="w-4 h-4" />;
      case 'completed':
        return <StopIcon className="w-4 h-4" />;
      default:
        return <StopIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">StockTake Sessions</h1>
          <p className="text-gray-600">Manage your inventory counting sessions</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2">
          <PlusIcon className="w-5 h-5" />
          <span>New Session</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">1</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <PlayIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">1</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <PauseIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paused Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <StopIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Sessions</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{session.name}</div>
                        <div className="text-sm text-gray-500">ID: {session.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                      {session.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                      {getStatusIcon(session.status)}
                      <span className="ml-1 capitalize">{session.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(session.startedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>Store: Central Store</div>
                      <div>Warehouse: Main Warehouse</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {session.status === 'active' && (
                        <button className="text-yellow-600 hover:text-yellow-900">
                          <PauseIcon className="h-4 w-4" />
                        </button>
                      )}
                      {session.status === 'paused' && (
                        <button className="text-green-600 hover:text-green-900">
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button className="text-red-600 hover:text-red-900">
                        <StopIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {sessions.length === 0 && (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first stocktake session.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
            Create Session
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <PlayIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Start New Session</p>
                <p className="text-xs text-gray-500">Begin inventory counting</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <EyeIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">View Reports</p>
                <p className="text-xs text-gray-500">Check session results</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-100">
                <ClipboardDocumentListIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Session Templates</p>
                <p className="text-xs text-gray-500">Create reusable templates</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockTakePage;
