import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  storeId: string | null;
  warehouseId: string | null;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

interface Location {
  id: string;
  name: string;
  type: string;
}

interface UserRole {
  value: string;
  label: string;
  description: string;
  permissions: string[];
}

const UsersPage: React.FC = () => {
  const router = useRouter();
  const { token, isAuthenticated, initializeAuth, isSessionValid, logout, user } = useAuthStore();
  const queryClient = useQueryClient();

  // State for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
    
    // Check if user is superadmin
    if (user?.role !== 'superadmin') {
      toast.error('Access denied. Superadmin role required.');
      router.push('/home');
      return;
    }
    
    // Check if session is still valid
    if (!isSessionValid()) {
      logout();
      router.push('/login');
      return;
    }
    
    initializeAuth();
  }, [router, isAuthenticated, token, isSessionValid, logout, initializeAuth, user]);

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

  // Don't render if not authenticated or not superadmin
  if (!isAuthenticated || !token || user?.role !== 'superadmin') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Fetch users
  const { data: usersData, isLoading, error } = useQuery(
    ['users', searchTerm, roleFilter, statusFilter, sortBy, sortOrder, currentPage, itemsPerPage, token],
    async () => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`http://localhost:3005/api/users?${params}`, {
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
        throw new Error('Failed to fetch users');
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
          toast.error('Failed to load users');
        }
      }
    }
  );

  // Fetch locations for user assignment
  const { data: locationsData } = useQuery(
    ['locations', token],
    async () => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch('http://localhost:3005/api/locations', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
    { enabled: !!token && isAuthenticated && isSessionValid() }
  );

  // Fetch user roles
  const { data: rolesData } = useQuery(
    ['user-roles', token],
    async () => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch('http://localhost:3005/api/users/roles', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch user roles');
      return response.json();
    },
    { enabled: !!token && isAuthenticated && isSessionValid() }
  );

  const users = usersData?.data || [];
  const locations = locationsData?.data || [];
  const roles = rolesData?.data || [];
  const pagination = usersData?.pagination;

  // Filter and sort users
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = !searchTerm || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a: User, b: User) => {
    const aValue = a[sortBy as keyof User];
    const bValue = b[sortBy as keyof User];
    
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

  // Create user mutation
  const createUserMutation = useMutation(
    async (data: any) => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch('http://localhost:3005/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User created successfully');
      },
      onError: () => {
        toast.error('Failed to create user');
      },
    }
  );

  // Delete user mutation
  const deleteUserMutation = useMutation(
    async (id: string) => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch(`http://localhost:3005/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete user');
      }
    }
  );

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  // Multi-select functions
  const handleSelectAll = () => {
    const users = filteredUsers || [];
    if (selectedItems.length === users.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(users.map((user: User) => user.id));
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
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} user(s)?`)) {
      selectedItems.forEach(id => deleteUserMutation.mutate(id));
      setSelectedItems([]);
      setIsSelectMode(false);
    }
  };

  const handleBulkExport = () => {
    const users = filteredUsers || [];
    const selectedUsers = users.filter((user: User) => 
      selectedItems.includes(user.id)
    );
    
    if (selectedUsers.length === 0) {
      toast.error('No users selected for export');
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
      ['Email', 'First Name', 'Last Name', 'Role', 'Store', 'Warehouse', 'Active', 'Last Login'],
      ...selectedUsers.map((user: User) => [
        escapeCSV(user.email),
        escapeCSV(user.firstName),
        escapeCSV(user.lastName),
        escapeCSV(user.role),
        escapeCSV(user.storeId ? getLocationName(user.storeId) : ''),
        escapeCSV(user.warehouseId ? getLocationName(user.warehouseId) : ''),
        escapeCSV(user.isActive ? 'Yes' : 'No'),
        escapeCSV(user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selectedItems.length} user(s)`);
    setSelectedItems([]);
    setIsSelectMode(false);
  };

  const handleFullExport = () => {
    const users = filteredUsers || [];
    
    if (users.length === 0) {
      toast.error('No users to export');
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
      ['Email', 'First Name', 'Last Name', 'Role', 'Store', 'Warehouse', 'Active', 'Last Login'],
      ...users.map((user: User) => [
        escapeCSV(user.email),
        escapeCSV(user.firstName),
        escapeCSV(user.lastName),
        escapeCSV(user.role),
        escapeCSV(user.storeId ? getLocationName(user.storeId) : ''),
        escapeCSV(user.warehouseId ? getLocationName(user.warehouseId) : ''),
        escapeCSV(user.isActive ? 'Yes' : 'No'),
        escapeCSV(user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-users-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported all ${users.length} user(s)`);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      
      const users = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          email: values[0]?.trim(),
          firstName: values[1]?.trim(),
          lastName: values[2]?.trim(),
          role: values[3]?.trim(),
          password: 'TempPassword123!', // Default password for imported users
          storeId: values[4]?.trim() || null,
          warehouseId: values[5]?.trim() || null,
          isActive: values[6]?.trim().toLowerCase() === 'yes'
        };
      }).filter(user => user.email);

      // Import users one by one
      users.forEach(user => {
        createUserMutation.mutate(user);
      });
      
      toast.success(`Importing ${users.length} user(s)...`);
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

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowsUpDownIcon className="w-4 h-4" />;
    return sortOrder === 'asc' ? (
      <ArrowsUpDownIcon className="w-4 h-4 rotate-180" />
    ) : (
      <ArrowsUpDownIcon className="w-4 h-4" />
    );
  };

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return 'N/A';
    const location = locations.find((loc: Location) => loc.id === locationId);
    return location ? location.name : 'Unknown';
  };

  const getRoleLabel = (role: string) => {
    const roleObj = roles.find((r: UserRole) => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      superadmin: 'bg-red-100 text-red-800',
      retail_manager: 'bg-blue-100 text-blue-800',
      warehouse_manager: 'bg-green-100 text-green-800',
      staff: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <XCircleIcon className="w-8 h-8 text-red-400 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Error Loading Users</h3>
            <p className="text-red-600 mt-1">Failed to load users. Please try again.</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage system users and permissions</p>
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
            <span>Add User</span>
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
            </div>
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            >
              <option value="">All Roles</option>
              {roles.map((role: UserRole) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Mobile Card View for very small screens */}
        <div className="block sm:hidden">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-gray-500">Loading users...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user: User) => (
                <div key={user.id} className={`p-4 hover:bg-gray-50 ${
                  selectedItems.includes(user.id) ? 'bg-blue-50' : ''
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      {isSelectMode && (
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(user.id)}
                          onChange={() => handleSelectItem(user.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                        />
                      )}
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                    {!isSelectMode && (
                      <div className="flex space-x-2 ml-3">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit user"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete user"
                          disabled={user.id === '1'}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isSelectMode && (
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === (filteredUsers?.length || 0) && filteredUsers?.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                  )}
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('firstName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>User</span>
                      {getSortIcon('firstName')}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Email</span>
                      {getSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Role</span>
                      {getSortIcon('role')}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Location
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('isActive')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('isActive')}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 hidden xl:table-cell"
                    onClick={() => handleSort('lastLogin')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Login</span>
                      {getSortIcon('lastLogin')}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user: User) => (
                  <tr key={user.id} className={`hover:bg-gray-50 ${
                    selectedItems.includes(user.id) ? 'bg-blue-50' : ''
                  }`}>
                    {isSelectMode && (
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(user.id)}
                          onChange={() => handleSelectItem(user.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {user.storeId && (
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span>Store: {getLocationName(user.storeId)}</span>
                          </div>
                        )}
                        {user.warehouseId && (
                          <div className="flex items-center mt-1">
                            <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span>Warehouse: {getLocationName(user.warehouseId)}</span>
                          </div>
                        )}
                        {!user.storeId && !user.warehouseId && (
                          <span className="text-gray-500">No location assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? (
                          <><CheckCircleIcon className="w-3 h-3 mr-1" />Active</>
                        ) : (
                          <><XCircleIcon className="w-3 h-3 mr-1" />Inactive</>
                        )}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!isSelectMode && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit user"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete user"
                            disabled={user.id === '1'}
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
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && users.length === 0 && (
        <div className="text-center py-8 sm:py-12 px-4">
          <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4">
            {searchTerm || roleFilter || statusFilter ? 'Try adjusting your search criteria.' : 'Get started by adding your first user.'}
          </p>
          {!searchTerm && !roleFilter && !statusFilter && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base"
            >
              Add User
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
              disabled={currentPage === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, pagination.totalItems)}
                </span>{' '}
                of <span className="font-medium">{pagination.totalItems}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-xs sm:text-sm font-medium ${
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
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          locations={locations}
          roles={roles}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
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

// User Modal Component
interface UserModalProps {
  user?: User | null;
  locations: Location[];
  roles: UserRole[];
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, locations, roles, onClose }) => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 'staff',
    storeId: user?.storeId || '',
    warehouseId: user?.warehouseId || '',
    isActive: user?.isActive ?? true
  });

  const createMutation = useMutation(
    async (data: typeof formData) => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch('http://localhost:3005/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User created successfully');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create user');
      }
    }
  );

  const updateMutation = useMutation(
    async (data: typeof formData) => {
      if (!token) throw new Error('No authentication token');
      const response = await fetch(`http://localhost:3005/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User updated successfully');
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to update user');
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 sm:top-10 lg:top-20 mx-auto p-4 sm:p-5 border w-11/12 sm:w-96 lg:w-[500px] shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
              {user ? 'Edit User' : 'Create New User'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password {user && <span className="text-gray-500 text-xs sm:text-sm">(leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                required={!user}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Store</label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No Store</option>
                  {locations.filter((loc: Location) => loc.type === 'store').map((loc: Location) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                <select
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No Warehouse</option>
                  {locations.filter((loc: Location) => loc.type === 'warehouse').map((loc: Location) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active User
                </label>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
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
            <h3 className="text-lg font-medium text-gray-900">Import Users</h3>
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
                Email, First Name, Last Name, Role, Store ID, Warehouse ID, Active
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Active should be "Yes" or "No". Default password will be set for all imported users.
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
            <h3 className="text-lg font-medium text-gray-900">Export Users</h3>
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
                <li>• CSV format with all user data</li>
                <li>• Includes: Email, Name, Role, Locations, Status</li>
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

export default UsersPage;
