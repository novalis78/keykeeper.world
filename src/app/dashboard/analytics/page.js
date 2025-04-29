'use client';

import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import StatsCard from '../../../components/dashboard/StatsCard';
import { mockStats, mockUserProfile } from '../../../lib/email/mock-data';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function Analytics() {
  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-gray-400">
            Overview of your email and account usage statistics
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCard stats={mockStats} userProfile={mockUserProfile} />
        </div>
        
        {/* Additional Analytics */}
        <div className="bg-sidebar shadow rounded-lg overflow-hidden p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-white flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2 text-primary-500" />
              Usage Trends
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Email activity and storage usage over time
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Placeholder for Email Activity Chart */}
            <div className="bg-dashboard rounded-lg p-4 border border-gray-700 min-h-[250px] flex items-center justify-center">
              <p className="text-gray-400 text-sm">Email Activity Chart - Coming Soon</p>
            </div>
            
            {/* Placeholder for Storage Usage Chart */}
            <div className="bg-dashboard rounded-lg p-4 border border-gray-700 min-h-[250px] flex items-center justify-center">
              <p className="text-gray-400 text-sm">Storage Usage Chart - Coming Soon</p>
            </div>
          </div>
        </div>
        
        {/* Additional Metrics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Response Time */}
          <div className="bg-sidebar shadow rounded-lg overflow-hidden p-6 border border-gray-700">
            <h3 className="text-md font-medium text-white mb-2">Response Time</h3>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-primary-500">{mockStats.averageResponseTime}</span>
              <span className="ml-1 text-gray-400">ms</span>
            </div>
            <p className="mt-2 text-sm text-gray-400">Average server response time</p>
          </div>
          
          {/* Encryption Rate */}
          <div className="bg-sidebar shadow rounded-lg overflow-hidden p-6 border border-gray-700">
            <h3 className="text-md font-medium text-white mb-2">Encryption Rate</h3>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-primary-500">100%</span>
            </div>
            <p className="mt-2 text-sm text-gray-400">All emails are fully encrypted</p>
          </div>
          
          {/* Active Sessions */}
          <div className="bg-sidebar shadow rounded-lg overflow-hidden p-6 border border-gray-700">
            <h3 className="text-md font-medium text-white mb-2">Active Sessions</h3>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-primary-500">1</span>
            </div>
            <p className="mt-2 text-sm text-gray-400">Current device only</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}