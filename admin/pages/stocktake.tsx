import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../stores/authStore';
import { 
  ClipboardDocumentListIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  EyeIcon,
  ArrowLeftIcon,
  PrinterIcon,
  TagIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

const StockTakePage: React.FC = () => {
  const router = useRouter();
  const { token, isAuthenticated, initializeAuth, isSessionValid, logout } = useAuthStore();
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelType, setLabelType] = useState('item');
  const [labelQuantity, setLabelQuantity] = useState(1);
  const [labelFormat, setLabelFormat] = useState('standard');

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

  const handleBack = () => {
    router.push('/home');
  };

  const handleGenerateLabels = () => {
    setShowLabelModal(true);
  };

  const handlePrintLabels = () => {
    // Simulate label printing
    alert(`Printing ${labelQuantity} ${labelType} labels in ${labelFormat} format`);
    setShowLabelModal(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors w-fit"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </button>
          <div className="hidden sm:block border-l border-gray-300 h-8"></div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">StockTake Sessions</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your inventory counting sessions</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
            onClick={handleGenerateLabels}
            className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-md flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <PrinterIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Generate Labels</span>
            <span className="sm:hidden">Labels</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md flex items-center justify-center space-x-2 text-sm sm:text-base">
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">New Session</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-lg bg-blue-100">
              <ClipboardDocumentListIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="ml-2 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">1</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-lg bg-green-100">
              <PlayIcon className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="ml-2 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">1</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-lg bg-yellow-100">
              <PauseIcon className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
            <div className="ml-2 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Paused Sessions</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 rounded-lg bg-blue-100">
              <StopIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="ml-2 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Completed Sessions</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-3 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Recent Sessions</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Type
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Started
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Location
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <ClipboardDocumentListIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-2 sm:ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none">{session.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500">ID: {session.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                      {session.type}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                      {getStatusIcon(session.status)}
                      <span className="ml-1 capitalize">{session.status}</span>
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                    {new Date(session.startedAt).toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                    <div>
                      <div>Store: Central Store</div>
                      <div>Warehouse: Main Warehouse</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1 sm:space-x-2">
                      <button className="text-blue-600 hover:text-blue-900" title="View">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {session.status === 'active' && (
                        <button className="text-yellow-600 hover:text-yellow-900" title="Pause">
                          <PauseIcon className="h-4 w-4" />
                        </button>
                      )}
                      {session.status === 'paused' && (
                        <button className="text-green-600 hover:text-green-900" title="Resume">
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button className="text-red-600 hover:text-red-900" title="Stop">
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
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <button className="p-3 sm:p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Start New Session</p>
                <p className="text-xs text-gray-500">Begin inventory counting</p>
              </div>
            </div>
          </button>
          
          <button className="p-3 sm:p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">View Reports</p>
                <p className="text-xs text-gray-500">Check session results</p>
              </div>
            </div>
          </button>
          
          <button className="p-3 sm:p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-100">
                <ClipboardDocumentListIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Session Templates</p>
                <p className="text-xs text-gray-500">Create reusable templates</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Label Generation Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 sm:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Generate Labels
                </h3>
                <button
                  onClick={() => setShowLabelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Label Type</label>
                  <select
                    value={labelType}
                    onChange={(e) => setLabelType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  >
                    <option value="item">Item Labels</option>
                    <option value="location">Location Labels</option>
                    <option value="session">Session Labels</option>
                    <option value="rfid">RFID Labels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={labelQuantity}
                    onChange={(e) => setLabelQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                  <select
                    value={labelFormat}
                    onChange={(e) => setLabelFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  >
                    <option value="standard">Standard (2" x 1")</option>
                    <option value="small">Small (1" x 0.5")</option>
                    <option value="large">Large (4" x 2")</option>
                    <option value="custom">Custom Size</option>
                  </select>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <TagIcon className="w-4 h-4" />
                    <span>Preview: {labelQuantity} {labelType} labels ({labelFormat})</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    onClick={() => setShowLabelModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePrintLabels}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <PrinterIcon className="w-4 h-4" />
                    <span>Print Labels</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTakePage;
