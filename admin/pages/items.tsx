import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  CubeIcon,
  TagIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  Squares2X2Icon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface Item {
  id: string;
  sku: string;
  shortId: string;
  name: string;
  description: string;
  hasRfid: boolean;
  category: string;
  unitPrice: number;
  storeId: string;
  warehouseId: string;
  isActive: boolean;
}

interface Location {
  id: string;
  name: string;
  type: string;
}

const ItemsPage: React.FC = () => {
  const router = useRouter();
  const { token, isAuthenticated, initializeAuth, isSessionValid, logout } = useAuthStore();
  const queryClient = useQueryClient();

  // State for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

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

  // Fetch items with authentication
  const { data: itemsData, isLoading, error } = useQuery(
    ['items', searchTerm, storeFilter, warehouseFilter, categoryFilter, sortBy, sortOrder, currentPage, token],
    async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        sortBy,
        sortOrder,
        ...(storeFilter && { storeId: storeFilter }),
        ...(warehouseFilter && { warehouseId: warehouseFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      });

      const response = await fetch(`http://localhost:3005/api/items?${params}`, {
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
        throw new Error('Failed to fetch items');
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
          toast.error('Failed to load items');
        }
      }
    }
  );

  // Fetch locations for filters
  const { data: locationsData } = useQuery(
    ['locations', token],
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

  const items = itemsData?.data || [];
  const totalItems = itemsData?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const locations = locationsData?.data || [];

  // Filter and sort items
  const filteredItems = items.filter((item: Item) => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.shortId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStore = !storeFilter || item.storeId === storeFilter;
    const matchesWarehouse = !warehouseFilter || item.warehouseId === warehouseFilter;
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    
    return matchesSearch && matchesStore && matchesWarehouse && matchesCategory;
  }).sort((a: Item, b: Item) => {
    const aValue = a[sortBy as keyof Item];
    const bValue = b[sortBy as keyof Item];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  // Create item mutation
  const createItemMutation = useMutation(
    async (data: any) => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch('http://localhost:3005/api/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create item');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('items');
        toast.success('Item created successfully');
      },
      onError: () => {
        toast.error('Failed to create item');
      },
    }
  );

  // Delete item mutation
  const deleteItemMutation = useMutation(
    async (id: string) => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch(`http://localhost:3005/api/items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to delete item');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('items');
        toast.success('Item deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete item');
      },
    }
  );

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(id);
    }
  };

  // Multi-select functions
  const handleSelectAll = () => {
    const items = filteredItems || [];
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item: Item) => item.id));
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
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
      selectedItems.forEach(id => deleteItemMutation.mutate(id));
      setSelectedItems([]);
      setIsSelectMode(false);
    }
  };

  const handleBulkExport = () => {
    const items = filteredItems || [];
    const selectedItemsData = items.filter((item: Item) => 
      selectedItems.includes(item.id)
    );
    
    if (selectedItemsData.length === 0) {
      toast.error('No items selected for export');
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
      ['SKU', 'Short ID', 'Name', 'Description', 'Category', 'Unit Price', 'Store', 'Warehouse', 'Has RFID', 'Active'],
      ...selectedItemsData.map((item: Item) => [
        escapeCSV(item.sku),
        escapeCSV(item.shortId),
        escapeCSV(item.name),
        escapeCSV(item.description),
        escapeCSV(item.category),
        escapeCSV(item.unitPrice),
        escapeCSV(getLocationName(item.storeId)),
        escapeCSV(getLocationName(item.warehouseId)),
        escapeCSV(item.hasRfid ? 'Yes' : 'No'),
        escapeCSV(item.isActive ? 'Yes' : 'No')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `items-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selectedItems.length} item(s)`);
    setSelectedItems([]);
    setIsSelectMode(false);
  };

  const handleFullExport = () => {
    const items = filteredItems || [];
    
    if (items.length === 0) {
      toast.error('No items to export');
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
      ['SKU', 'Short ID', 'Name', 'Description', 'Category', 'Unit Price', 'Store', 'Warehouse', 'Has RFID', 'Active'],
      ...items.map((item: Item) => [
        escapeCSV(item.sku),
        escapeCSV(item.shortId),
        escapeCSV(item.name),
        escapeCSV(item.description),
        escapeCSV(item.category),
        escapeCSV(item.unitPrice),
        escapeCSV(getLocationName(item.storeId)),
        escapeCSV(getLocationName(item.warehouseId)),
        escapeCSV(item.hasRfid ? 'Yes' : 'No'),
        escapeCSV(item.isActive ? 'Yes' : 'No')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-items-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported all ${items.length} item(s)`);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      
      const items = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          sku: values[0]?.trim(),
          shortId: values[1]?.trim(),
          name: values[2]?.trim(),
          description: values[3]?.trim(),
          category: values[4]?.trim(),
          unitPrice: parseFloat(values[5]?.trim() || '0'),
          storeId: values[6]?.trim(),
          warehouseId: values[7]?.trim(),
          hasRfid: values[8]?.trim().toLowerCase() === 'yes',
          isActive: values[9]?.trim().toLowerCase() === 'yes'
        };
      }).filter(item => item.name);

      // Import items one by one
      items.forEach(item => {
        createItemMutation.mutate(item);
      });
      
      toast.success(`Importing ${items.length} item(s)...`);
      setShowImportModal(false);
    };
    reader.readAsText(file);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find((loc: Location) => loc.id === locationId);
    return location ? location.name : 'Unknown';
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowsUpDownIcon className="w-4 h-4" />;
    return sortOrder === 'asc' ? (
      <ArrowsUpDownIcon className="w-4 h-4 rotate-180" />
    ) : (
      <ArrowsUpDownIcon className="w-4 h-4" />
    );
  };

  // Don't render if not authenticated
  if (!isAuthenticated || !token) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Items</h1>
            <p className="text-gray-600">Manage your inventory items</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading items</h3>
              <p className="text-sm text-red-700 mt-1">
                {error.message === 'Authentication expired' 
                  ? 'Your session has expired. Please login again.' 
                  : 'Please try refreshing the page or contact support if the problem persists.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Refresh page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Items</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your inventory items</p>
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
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
            </div>
          </div>
          <div>
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            >
              <option value="">All Stores</option>
              {locations
                .filter((loc: Location) => loc.type === 'store')
                .map((loc: Location) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
            </select>
          </div>
          <div>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            >
              <option value="">All Warehouses</option>
              {locations
                .filter((loc: Location) => loc.type === 'warehouse')
                .map((loc: Location) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-500">Loading items...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isSelectMode && (
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === (filteredItems?.length || 0) && filteredItems?.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                  )}
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Item</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden sm:table-cell"
                    onClick={() => handleSort('sku')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>SKU</span>
                      {getSortIcon('sku')}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden lg:table-cell"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Category</span>
                      {getSortIcon('category')}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden lg:table-cell"
                    onClick={() => handleSort('unitPrice')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Price</span>
                      {getSortIcon('unitPrice')}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                    Location
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    RFID
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item: Item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${
                    selectedItems.includes(item.id) ? 'bg-blue-50' : ''
                  }`}>
                    {isSelectMode && (
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <CubeIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-2 sm:ml-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{item.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500">{item.shortId}</div>
                          <div className="text-xs text-gray-500 sm:hidden font-mono">{item.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center">
                        <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 font-mono">{item.sku}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{item.unitPrice.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span>Store: {getLocationName(item.storeId)}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span>Warehouse: {getLocationName(item.warehouseId)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.hasRfid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.hasRfid ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!isSelectMode && (
                        <div className="flex space-x-1 sm:space-x-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="text-center py-12">
          <CubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || storeFilter || warehouseFilter ? 'Try adjusting your search criteria.' : 'Get started by adding your first item.'}
          </p>
          {!searchTerm && !storeFilter && !warehouseFilter && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Add Item
            </button>
          )}
        </div>
      )}

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
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                <span className="font-medium">{totalItems}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
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

      {/* Modals */}
      {(showCreateModal || editingItem) && (
        <ItemModal
          item={editingItem}
          locations={locations}
          onClose={() => {
            setShowCreateModal(false);
            setEditingItem(null);
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


// Item Modal Component
interface ItemModalProps {
  item?: Item | null;
  locations: Location[];
  onClose: () => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ item, locations, onClose }) => {
  const { token } = useAuthStore();
  const [formData, setFormData] = useState({
    sku: item?.sku || '',
    shortId: item?.shortId || '',
    name: item?.name || '',
    description: item?.description || '',
    hasRfid: item?.hasRfid || false,
    category: item?.category || '',
    unitPrice: item?.unitPrice || 0,
    storeId: item?.storeId || '',
    warehouseId: item?.warehouseId || '',
    isActive: item?.isActive ?? true,
  });

  const queryClient = useQueryClient();

  const createItemMutation = useMutation(
    async (newItem: any) => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch('http://localhost:3005/api/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) throw new Error('Failed to create item');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('items');
        toast.success('Item created successfully');
        onClose();
      },
      onError: () => {
        toast.error('Failed to create item');
      },
    }
  );

  const updateItemMutation = useMutation(
    async (updatedItem: any) => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch(`http://localhost:3005/api/items/${item?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItem),
      });
      if (!response.ok) throw new Error('Failed to update item');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('items');
        toast.success('Item updated successfully');
        onClose();
      },
      onError: () => {
        toast.error('Failed to update item');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      updateItemMutation.mutate(formData);
    } else {
      createItemMutation.mutate(formData);
    }
  };

  const stores = locations.filter((loc: Location) => loc.type === 'store');
  const warehouses = locations.filter((loc: Location) => loc.type === 'warehouse');

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {item ? 'Edit Item' : 'Add New Item'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Short ID</label>
              <input
                type="text"
                value={formData.shortId}
                onChange={(e) => setFormData({ ...formData, shortId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Store</label>
              <select
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a store</option>
                {stores.map((store: Location) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Warehouse</label>
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a warehouse</option>
                {warehouses.map((warehouse: Location) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasRfid"
                checked={formData.hasRfid}
                onChange={(e) => setFormData({ ...formData, hasRfid: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="hasRfid" className="ml-2 block text-sm text-gray-900">
                Has RFID
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createItemMutation.isLoading || updateItemMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {item ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
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
            <h3 className="text-lg font-medium text-gray-900">Import Items</h3>
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
                SKU, Short ID, Name, Description, Category, Unit Price, Store ID, Warehouse ID, Has RFID, Active
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Has RFID and Active should be "Yes" or "No"
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
            <h3 className="text-lg font-medium text-gray-900">Export Items</h3>
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
                <li>• CSV format with all item data</li>
                <li>• Includes: SKU, Name, Category, Price, Locations</li>
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

export default ItemsPage;
