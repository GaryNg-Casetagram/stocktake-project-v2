import React from 'react';
import { 
  PresentationChartLineIcon,
  DocumentTextIcon,
  ChartBarIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and view detailed reports for your inventory operations</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <PresentationChartLineIcon className="h-12 w-12 text-white" />
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold">Reports Dashboard</h2>
            <p className="text-blue-100 mt-2">
              Advanced reporting and analytics features are coming soon. 
              This will include detailed inventory reports, session summaries, and performance metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Reports */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 ml-3">Inventory Reports</h3>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Inventory reports will be available here</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        </div>

        {/* Session Reports */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 ml-3">Session Reports</h3>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Session reports will be available here</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <PresentationChartLineIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 ml-3">Performance Metrics</h3>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <PresentationChartLineIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Performance metrics will be available here</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-yellow-100">
              <TableCellsIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 ml-3">Data Export</h3>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <TableCellsIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Data export tools will be available here</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Roadmap */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Planned Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Real-time inventory reports</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Session performance analytics</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Custom report builder</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Automated report scheduling</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Excel/CSV export functionality</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Interactive charts and graphs</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Comparative analysis tools</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Email report delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
