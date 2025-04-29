'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import EmailRow from '../../components/dashboard/EmailRow';
import EmailDetail from '../../components/dashboard/EmailDetail';
import { mockMessages } from '../../lib/email/mock-data';
import { 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  FunnelIcon,
  EnvelopeIcon,
  InboxIcon,
  TrashIcon,
  StarIcon,
  ArchiveBoxIcon,
  TagIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [refreshing, setRefreshing] = useState(false);
  
  const filteredMessages = mockMessages.filter(message => 
    (message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.from.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.snippet.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  
  return (
    <DashboardLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
          <p className="mt-1 text-sm text-gray-400">
            Your secure, encrypted messages
          </p>
        </div>
        
        {/* Email Toolbar */}
        <div className="bg-sidebar shadow rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-6 border-b border-gray-700">
            {/* Folder Navigation */}
            <div className="col-span-1 md:col-span-2 md:border-r border-gray-700 p-1.5">
              <div className="flex items-center space-x-0.5">
                <button
                  onClick={() => setCurrentFolder('inbox')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                    currentFolder === 'inbox' 
                      ? 'bg-primary-600/20 text-primary-400' 
                      : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <InboxIcon className="h-4 w-4 mr-1.5" />
                  Inbox
                </button>
                
                <button
                  onClick={() => setCurrentFolder('starred')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                    currentFolder === 'starred' 
                      ? 'bg-primary-600/20 text-primary-400' 
                      : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <StarIcon className="h-4 w-4 mr-1.5" />
                  Starred
                </button>
                
                <button
                  onClick={() => setCurrentFolder('archive')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                    currentFolder === 'archive' 
                      ? 'bg-primary-600/20 text-primary-400' 
                      : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <ArchiveBoxIcon className="h-4 w-4 mr-1.5" />
                  Archive
                </button>
              </div>
            </div>
            
            {/* Search and Actions */}
            <div className="col-span-1 md:col-span-4 px-4 py-1.5 flex items-center justify-between">
              {!selectedEmail && (
                <>
                  <div className="flex-grow relative rounded-md shadow-sm max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-9 pr-3 py-1.5 border border-gray-700 rounded-md leading-5 bg-dashboard placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm text-white"
                      placeholder="Search in emails"
                    />
                  </div>
                  
                  <div className="flex items-center ml-2">
                    <button 
                      type="button"
                      className="inline-flex items-center p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <FunnelIcon className="h-4 w-4" />
                    </button>
                    
                    <button 
                      type="button"
                      onClick={handleRefresh}
                      className={`ml-1 inline-flex items-center p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors ${
                        refreshing ? 'animate-spin text-primary-400' : ''
                      }`}
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
              
              {selectedEmail && (
                <div className="flex items-center">
                  <h3 className="text-base font-medium text-white">
                    Message Details
                  </h3>
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
              <div>
                {filteredMessages.map(message => (
                  <EmailRow
                    key={message.id}
                    message={message}
                    onClick={() => setSelectedEmail(message)}
                    isSelected={false}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                <div className="mb-4 bg-primary-600/20 p-4 rounded-full">
                  <EnvelopeIcon className="h-8 w-8 text-primary-400" />
                </div>
                {searchQuery ? (
                  <>
                    <h3 className="mt-2 text-lg font-medium text-white">No emails found</h3>
                    <p className="mt-1 text-sm text-gray-400 max-w-md">
                      No messages match your search criteria. Try adjusting your search terms or clear the search.
                    </p>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500 transition-colors"
                      >
                        Clear search
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="mt-2 text-lg font-medium text-white">Your inbox is empty</h3>
                    <p className="mt-1 text-sm text-gray-400 max-w-md">
                      You have no messages in this folder. Messages you receive will appear here.
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