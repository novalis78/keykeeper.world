'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import EmailRow from '../../components/dashboard/EmailRow';
import EmailDetail from '../../components/dashboard/EmailDetail';
import StatsCard from '../../components/dashboard/StatsCard';
import { mockMessages, mockStats, mockUserProfile } from '../../lib/email/mock-data';
import { 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  FunnelIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredMessages = mockMessages.filter(message => 
    message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.from.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            Welcome to your secure email dashboard
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCard stats={mockStats} userProfile={mockUserProfile} />
        </div>
        
        {/* Email Section */}
        <div className="bg-sidebar shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between">
              <h3 className="text-lg font-medium leading-6 text-white">
                {selectedEmail ? 'Email Detail' : 'Inbox'}
              </h3>
              
              {!selectedEmail && (
                <div className="mt-3 sm:mt-0 flex items-center">
                  <div className="relative rounded-md shadow-sm max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-dashboard placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-white"
                      placeholder="Search emails"
                    />
                  </div>
                  
                  <button 
                    type="button"
                    className="ml-3 inline-flex items-center p-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-white bg-sidebar hover:bg-dashboard focus:outline-none"
                  >
                    <FunnelIcon className="h-5 w-5" />
                  </button>
                  
                  <button 
                    type="button"
                    className="ml-3 inline-flex items-center p-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-white bg-sidebar hover:bg-dashboard focus:outline-none"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div>
            {selectedEmail ? (
              <EmailDetail 
                message={selectedEmail} 
                onBack={() => setSelectedEmail(null)} 
              />
            ) : filteredMessages.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMessages.map(message => (
                  <EmailRow
                    key={message.id}
                    message={message}
                    onClick={() => setSelectedEmail(message)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="mb-4 bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                  <EnvelopeIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                {searchQuery ? (
                  <>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No emails found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Try adjusting your search terms or clear the search.
                    </p>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 dark:text-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-800/50 transition-colors"
                      >
                        Clear search
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No emails</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Your inbox is empty or still loading.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}