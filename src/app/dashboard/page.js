'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import EmailRow from '../../components/dashboard/EmailRow';
import EmailDetail from '../../components/dashboard/EmailDetail';
import MailCredentialsModal from '../../components/mail/MailCredentialsModal';
import { mockMessages } from '../../lib/email/mock-data';
import { getCurrentUserId } from '../../lib/auth/getCurrentUser';
import { getCredentials, getSessionKey } from '../../lib/mail/mailCredentialManager';
import { useAuth } from '../../lib/auth/useAuth';
import { 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  FunnelIcon,
  EnvelopeIcon,
  InboxIcon,
  TrashIcon,
  StarIcon,
  ArchiveBoxIcon,
  TagIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsRequired, setCredentialsRequired] = useState(false);
  const { user, getToken } = useAuth();
  
  // Fetch real messages from the inbox
  useEffect(() => {
    fetchInboxMessages();
    
    // If the URL contains a 'new_account' parameter, show the credentials modal
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('new_account')) {
        setShowCredentialsModal(true);
      }
    }
  }, []);
  
  const fetchInboxMessages = async (userCredentials = null) => {
    setLoading(true);
    setError(null);
    setCredentialsRequired(false);
    
    try {
      // Get the user ID from the current session
      const userId = getCurrentUserId();
      
      if (!userId) {
        throw new Error('User not logged in. Please sign in to view your inbox.');
      }
      
      // If user credentials were not provided directly, try to get them from storage
      let credentials = userCredentials;
      if (!credentials) {
        try {
          console.log('=== KEYKEEPER: Attempting to retrieve stored mail credentials ===');
          
          // First make sure we have the user email
          const email = user?.email || localStorage.getItem('user_email');
          if (!email) {
            throw new Error('User email not available');
          }
          
          // Generate account ID from email
          const accountId = `account_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
          console.log(`Using account ID: ${accountId}`);
          
          // First try the direct storage method (no encryption)
          const directStorageKey = `kk_mail_${accountId}_direct`;
          const directCredentials = localStorage.getItem(directStorageKey);
          
          if (directCredentials) {
            console.log('Found direct credentials in localStorage!');
            credentials = JSON.parse(directCredentials);
            console.log('=== KEYKEEPER: Successfully retrieved direct mail credentials ===');
            console.log(`Using credentials for: ${credentials.email}`);
            console.log(`Credential timestamp: ${new Date(credentials.timestamp).toISOString()}`);
          } else {
            console.log('No direct credentials found, trying encrypted storage...');
            
            // If no direct credentials, try the encrypted storage
            // First make sure we have the user fingerprint - try multiple sources
            let fingerprint = user?.fingerprint;
            
            // If fingerprint is not in user object, try to get it from localStorage
            if (!fingerprint) {
              console.log('Fingerprint not in user object, checking localStorage...');
              fingerprint = localStorage.getItem('user_fingerprint');
              
              if (fingerprint) {
                console.log(`Found fingerprint in localStorage: ${fingerprint}`);
              } else {
                console.log('Fingerprint not found in localStorage, trying JWT token...');
                
                // Try to extract fingerprint from JWT token
                try {
                  const token = getToken();
                  if (token) {
                    // Parse JWT without verification
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const payload = JSON.parse(atob(base64));
                    
                    if (payload.fingerprint) {
                      fingerprint = payload.fingerprint;
                      console.log(`Extracted fingerprint from token: ${fingerprint}`);
                      localStorage.setItem('user_fingerprint', fingerprint);
                    }
                  }
                } catch (tokenError) {
                  console.error('Error extracting fingerprint from token:', tokenError);
                }
              }
            }
            
            if (fingerprint) {
              console.log(`Using fingerprint: ${fingerprint}`);
              
              // Get the session key
              const token = getToken();
              console.log('Got auth token, deriving session key...');
              
              const sessionKey = await getSessionKey(token, fingerprint);
              console.log('Session key derived successfully');
              
              // Try to get credentials from secure storage
              credentials = await getCredentials(accountId, sessionKey);
              
              if (credentials) {
                console.log('=== KEYKEEPER: Successfully retrieved encrypted mail credentials ===');
                console.log(`Using credentials for: ${credentials.email}`);
                console.log(`Credential timestamp: ${new Date(credentials.timestamp).toISOString()}`);
              } else {
                console.warn('No encrypted credentials found');
              }
            } else {
              console.error('Failed to retrieve user fingerprint from any source');
            }
          }
          
          if (!credentials) {
            console.warn('No stored credentials found - user may need to enter manually');
          }
        } catch (credError) {
          console.error('=== KEYKEEPER ERROR: Failed to retrieve credentials ===');
          console.error('Error details:', credError);
          console.error('Stack trace:', credError.stack);
          // Continue without credentials, the server will prompt if needed
        }
      } else if (userCredentials) {
        console.log('Using explicitly provided credentials');
      }
      
      console.log('Fetching inbox for user ID:', userId);
      
      // Try to activate mail account if this is the first login
      if (credentials) {
        try {
          console.log('=== KEYKEEPER: Checking if mail account needs activation ===');
          
          // Call the mail activation API
          const activationResponse = await fetch('/api/mail/activate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              derivedPassword: credentials.password,
              email: credentials.email
            }),
          });
          
          const activationData = await activationResponse.json();
          
          if (activationResponse.ok) {
            if (activationData.activated) {
              console.log('=== KEYKEEPER: Successfully activated mail account! ===');
            } else if (activationData.alreadyActive) {
              console.log('=== KEYKEEPER: Mail account already activated ===');
            }
          } else {
            console.error('=== KEYKEEPER ERROR: Failed to activate mail account ===');
            console.error('Error details:', activationData.error);
            console.error('Additional details:', activationData.details);
          }
        } catch (activationError) {
          console.error('=== KEYKEEPER ERROR: Exception during mail account activation ===');
          console.error('Error details:', activationError);
          console.error('Stack trace:', activationError.stack);
          // Continue despite activation error - it might work anyway
        }
      }
      
      // Add credentials to request if available
      const requestBody = { userId };
      if (credentials) {
        console.log('Including stored credentials in API request');
        // Only include necessary credential fields for security
        requestBody.credentials = {
          email: credentials.email,
          password: credentials.password,
          imapServer: credentials.imapServer,
          imapPort: credentials.imapPort,
          imapSecure: credentials.imapSecure
        };
        // Debug log - mask the password
        const debugCreds = {...requestBody.credentials};
        debugCreds.password = debugCreds.password ? '****' : null;
        console.log('Credential details:', debugCreds);
      } else {
        console.warn('No credentials available for mail request');
      }
      
      const response = await fetch('/api/mail/inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Special handling for the credentials required error
        if (response.status === 401 && data.requireCredentials) {
          setCredentialsRequired(true);
          setShowCredentialsModal(true);
          throw new Error('Mail credentials required to access your inbox');
        }
        
        throw new Error(data.error || 'Failed to fetch inbox');
      }
      
      // Always use the real messages array from the server, even if empty
      if (data.messages) {
        setMessages(data.messages);
        console.log('Loaded real messages:', data.messages.length);
        
        // If inbox is empty, show a more helpful message
        if (data.messages.length === 0) {
          console.log('Inbox is empty. Send an email to see it here!');
        }
      } else {
        console.log('No messages array returned, something went wrong');
        // Only use mock data in development for troubleshooting
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock data for development');
          setMessages(mockMessages);
        } else {
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
      setError(err.message);
      
      // Don't fall back to mock data if credentials are required
      if (!credentialsRequired) {
        // Fall back to mock data
        setMessages(mockMessages);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchInboxMessages();
  };
  
  const filteredMessages = messages.filter(message => 
    (message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.from?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.from?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.snippet?.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Handle credentials submission from modal
  const handleCredentialsSubmit = (accountInfo) => {
    console.log('Credentials submitted for account:', accountInfo.email);
    fetchInboxMessages(accountInfo);
  };

  return (
    <DashboardLayout>
      {/* Mail Credentials Modal */}
      <MailCredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        onSuccess={handleCredentialsSubmit}
        email={user?.email}
      />
      
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
            ) : loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                <div className="mb-4 bg-primary-600/20 p-4 rounded-full animate-pulse">
                  <EnvelopeIcon className="h-8 w-8 text-primary-400 animate-bounce" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-white">Loading your inbox...</h3>
                <p className="mt-1 text-sm text-gray-400 max-w-md">
                  Please wait while we securely connect to your mailbox.
                </p>
              </div>
            ) : error ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                {credentialsRequired ? (
                  <>
                    <div className="mb-4 bg-yellow-600/20 p-4 rounded-full">
                      <KeyIcon className="h-8 w-8 text-yellow-400" />
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-white">Mail Credentials Required</h3>
                    <p className="mt-1 text-sm text-gray-400 max-w-md">
                      Please enter your mail password to access your emails. Your password is never stored on our servers.
                    </p>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setShowCredentialsModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500 transition-colors"
                      >
                        <KeyIcon className="h-4 w-4 mr-2" />
                        Enter Mail Credentials
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4 bg-red-600/20 p-4 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-white">Error loading inbox</h3>
                    <p className="mt-1 text-sm text-gray-400 max-w-md">
                      {error}
                    </p>
                    <div className="mt-6 space-x-4">
                      <button
                        type="button"
                        onClick={fetchInboxMessages}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500 transition-colors"
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCredentialsModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-200 bg-gray-800 hover:bg-gray-700 transition-colors"
                      >
                        <KeyIcon className="h-4 w-4 mr-2" />
                        Enter Mail Credentials
                      </button>
                    </div>
                  </>
                )}
              </div>
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