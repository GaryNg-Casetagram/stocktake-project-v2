import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../stores/authStore';
import { CogIcon, UserIcon, BellIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const SettingsPage: React.FC = () => {
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

  // Don't render if not authenticated
  if (!isAuthenticated || !token) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <UserIcon className="w-6 h-6 text-gray-400 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  defaultValue="John"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  defaultValue="Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue="manager.central@stocktake.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                Update Profile
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <BellIcon className="w-6 h-6 text-gray-400 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive email updates about system events</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Session Alerts</p>
                  <p className="text-sm text-gray-500">Get notified when sessions start or complete</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Low Stock Warnings</p>
                  <p className="text-sm text-gray-500">Alert when inventory levels are low</p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                Save Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-6 h-6 text-gray-400 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Security</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <CogIcon className="w-6 h-6 text-gray-400 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">System</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
                <input
                  type="text"
                  defaultValue="http://localhost:3005"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Page Size</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                  <option value="20">20 items</option>
                  <option value="50">50 items</option>
                  <option value="100">100 items</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Auto-refresh Data</p>
                  <p className="text-sm text-gray-500">Automatically refresh data every 30 seconds</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
