import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useRouter } from 'next/router';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

interface Location {
  id: string;
  name: string;
  type: 'store' | 'warehouse';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  manager: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const LocationsPage: React.FC = () => {
  const router = useRouter();
  const { token, isAuthenticated, initializeAuth, isSessionValid, logout } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const queryClient = useQueryClient();

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

  // Fetch locations with pagination
  const { data: locationsData, isLoading, error } = useQuery(
    ['locations', searchTerm, typeFilter, statusFilter, currentPage, token],
    async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('isActive', statusFilter);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      const response = await fetch(`http://localhost:3005/api/locations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          throw new Error('Authentication expired');
        }
        throw new Error('Failed to fetch locations');
      }
      return response.json();
    },
    {
      retry: false,
      enabled: !!token && isAuthenticated && isSessionValid(),
      onError: (error: any) => {
        if (error.message === 'Authentication expired') {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error('Failed to load locations');
        }
      }
    }
  );

  // Create location mutation
  const createLocationMutation = useMutation(
    async (data: any) => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch('http://localhost:3005/api/locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create location');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('locations');
        toast.success('Location created successfully');
      },
      onError: () => {
        toast.error('Failed to create location');
      },
    }
  );

  // Delete location mutation
  const deleteLocationMutation = useMutation(
    async (id: string) => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch(`http://localhost:3005/api/locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to delete location');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('locations');
        toast.success('Location deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete location');
      },
    }
  );

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      deleteLocationMutation.mutate(id);
    }
  };

  // Multi-select functions
  const handleSelectAll = () => {
    const locations = locationsData?.data || [];
    const currentPageIds = locations.map((location: Location) => location.id);
    
    // Check if all current page items are selected
    const allCurrentPageSelected = currentPageIds.every(id => selectedItems.includes(id));
    
    if (allCurrentPageSelected) {
      // Deselect all current page items
      setSelectedItems(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      // Select all current page items
      setSelectedItems(prev => {
        const newSelection = [...prev];
        currentPageIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} location(s)?`)) {
      selectedItems.forEach(id => deleteLocationMutation.mutate(id));
      setSelectedItems([]);
      setIsSelectMode(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedItems.length === 0) {
      toast.error('No locations selected for export');
      return;
    }
    
    try {
      // Fetch all locations to get complete data for selected items
      const response = await fetch('http://localhost:3005/api/locations?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch locations');
      const allLocationsData = await response.json();
      const allLocations = allLocationsData?.data || [];
      
      const selectedLocations = allLocations.filter((location: Location) => 
        selectedItems.includes(location.id)
      );
      
      if (selectedLocations.length === 0) {
        toast.error('No valid locations found for export');
        return;
      }
      
      const escapeCSV = (value: any) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };
      
      const csvContent = [
        ['Name', 'Type', 'Address', 'City', 'State', 'Zip Code', 'Country', 'Phone', 'Email', 'Manager', 'Active'],
        ...selectedLocations.map((location: Location) => [
          escapeCSV(location.name),
          escapeCSV(location.type),
          escapeCSV(location.address),
          escapeCSV(location.city),
          escapeCSV(location.state),
          escapeCSV(location.zipCode),
          escapeCSV(location.country),
          escapeCSV(location.phone),
          escapeCSV(location.email),
          escapeCSV(location.manager),
          escapeCSV(location.isActive ? 'Yes' : 'No')
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `locations-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${selectedLocations.length} location(s)`);
      setSelectedItems([]);
      setIsSelectMode(false);
    } catch (error) {
      toast.error('Failed to export locations');
      console.error('Export error:', error);
    }
  };

  const handleFullExport = async () => {
    try {
      // Fetch all locations for export
      const response = await fetch('http://localhost:3005/api/locations?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch locations');
      const allLocationsData = await response.json();
      const locations = allLocationsData?.data || [];
      
      if (locations.length === 0) {
        toast.error('No locations to export');
        return;
      }
      
      const escapeCSV = (value: any) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };
      
      const csvContent = [
        ['Name', 'Type', 'Address', 'City', 'State', 'Zip Code', 'Country', 'Phone', 'Email', 'Manager', 'Active'],
        ...locations.map((location: Location) => [
          escapeCSV(location.name),
          escapeCSV(location.type),
          escapeCSV(location.address),
          escapeCSV(location.city),
          escapeCSV(location.state),
          escapeCSV(location.zipCode),
          escapeCSV(location.country),
          escapeCSV(location.phone),
          escapeCSV(location.email),
          escapeCSV(location.manager),
          escapeCSV(location.isActive ? 'Yes' : 'No')
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-locations-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported all ${locations.length} location(s)`);
    } catch (error) {
      toast.error('Failed to export locations');
      console.error('Export error:', error);
    }
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      
      const locations = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          name: values[0]?.trim(),
          type: values[1]?.trim() as 'store' | 'warehouse',
          address: values[2]?.trim(),
          city: values[3]?.trim(),
          state: values[4]?.trim(),
          zipCode: values[5]?.trim(),
          country: values[6]?.trim(),
          phone: values[7]?.trim(),
          email: values[8]?.trim(),
          manager: values[9]?.trim(),
          isActive: values[10]?.trim().toLowerCase() === 'yes'
        };
      }).filter(loc => loc.name);

      // Import locations one by one
      locations.forEach(location => {
        createLocationMutation.mutate(location);
      });
      
      toast.success(`Importing ${locations.length} location(s)...`);
      setShowImportModal(false);
    };
    reader.readAsText(file);
  };

  const locations = locationsData?.data || [];
  const totalLocations = locationsData?.total || 0;
  const totalPages = Math.ceil(totalLocations / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your stores and warehouses ({totalLocations} total)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSelectMode && selectedItems.length > 0 && (
            <>
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Delete ({selectedItems.length})</span>
              </button>
              <button
                onClick={handleBulkExport}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span>Export ({selectedItems.length})</span>
              </button>
            </>
          )}
          <button
            onClick={() => setIsSelectMode(!isSelectMode)}
            className={`px-3 py-2 rounded-md flex items-center space-x-2 text-sm ${
              isSelectMode 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <Squares2X2Icon className="w-4 h-4" />
            <span>{isSelectMode ? 'Cancel' : 'Select'}</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button
            onClick={handleFullExport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export All</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Location</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="store">Stores</option>
              <option value="warehouse">Warehouses</option>
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading locations</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Please check your connection and try again.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))
        ) : (
          locations.map((location: Location) => (
            <div key={location.id} className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow ${
              isSelectMode ? 'ring-2 ring-blue-500' : ''
            } ${selectedItems.includes(location.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {isSelectMode && (
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(location.id)}
                        onChange={() => handleSelectItem(location.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                    )}
                    <div className="text-2xl mr-3">{location.type === 'store' ? '🏪' : '🏭'}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        location.type === 'store' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                      </span>
                    </div>
                  </div>
                  {!isSelectMode && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingLocation(location)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit location"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete location"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{location.address}, {location.city}, {location.state} {location.zipCode}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{location.phone}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{location.email}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Manager: {location.manager}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    {location.isActive ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs font-medium ${
                      location.isActive ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(location.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalLocations)}</span> of{' '}
                <span className="font-medium">{totalLocations}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && locations.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || typeFilter || statusFilter ? 'Try adjusting your search criteria.' : 'Get started by adding your first location.'}
          </p>
          {!searchTerm && !typeFilter && !statusFilter && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Add Location
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {(showCreateModal || editingLocation) && (
        <LocationModal
          location={editingLocation}
          onClose={() => {
            setShowCreateModal(false);
            setEditingLocation(null);
          }}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={handleFullExport}
        />
      )}
    </div>
  );
};

// Location Modal Component
const LocationModal: React.FC<{
  location?: Location | null;
  onClose: () => void;
}> = ({ location, onClose }) => {
  const { token } = useAuthStore();
  const [formData, setFormData] = useState({
    name: location?.name || '',
    type: location?.type || 'store',
    address: location?.address || '',
    city: location?.city || '',
    state: location?.state || '',
    zipCode: location?.zipCode || '',
    country: location?.country || 'USA',
    phone: location?.phone || '',
    email: location?.email || '',
    manager: location?.manager || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation(
    async (data: typeof formData) => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch('http://localhost:3005/api/locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create location');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('locations');
        toast.success('Location created successfully');
        onClose();
      },
      onError: () => {
        toast.error('Failed to create location');
      },
    }
  );

  const updateMutation = useMutation(
    async (data: typeof formData) => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch(`http://localhost:3005/api/locations/${location?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update location');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('locations');
        toast.success('Location updated successfully');
        onClose();
      },
      onError: () => {
        toast.error('Failed to update location');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {location ? 'Edit Location' : 'Add New Location'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'store' | 'warehouse' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="store">Store</option>
              <option value="warehouse">Warehouse</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Import Modal Component
const ImportModal: React.FC<{ onClose: () => void; onImport: (file: File) => void }> = ({ onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (file) {
      onImport(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Import Locations</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">CSV Format:</h4>
              <p className="text-xs text-gray-600">
                Name, Type, Address, City, State, Zip Code, Country, Phone, Email, Manager, Active
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Type should be "store" or "warehouse", Active should be "Yes" or "No"
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!file}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export Modal Component
const ExportModal: React.FC<{ onClose: () => void; onExport: () => void }> = ({ onClose, onExport }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Export Locations</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Export Options:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• CSV format with all location data</li>
                <li>• Includes: Name, Type, Address, Contact info</li>
                <li>• Ready for Excel or Google Sheets</li>
              </ul>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onExport();
                  onClose();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Export All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationsPage;
