'use client';

import { useState, useEffect } from 'react';
import { UserCircleIcon, EnvelopeIcon, KeyIcon, ShieldCheckIcon, BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/useAuth';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [publicKey, setPublicKey] = useState('');
  
  // Simulate fetching profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // In a real implementation, fetch actual user data
        // For now, we'll just use demo data and add a small delay
        setTimeout(() => {
          setPublicKey('-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: OpenPGP.js v4.10.10\nComment: https://openpgpjs.org\n\n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\nCRzfx+hIMUAWpCYK7Wzf\n=Q+Nl\n-----END PGP PUBLIC KEY BLOCK-----');
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);
  
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Profile</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {/* Profile header */}
          <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 bg-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-semibold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name || 'User'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                  <EnvelopeIcon className="h-4 w-4 mr-1" /> {user?.email || 'user@example.com'}
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                    Premium Account
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main profile content */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <KeyIcon className="h-5 w-5 mr-2 text-primary-500" /> 
                  PGP Key Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Key ID
                      </label>
                      <div className="mt-1 text-sm font-mono break-all text-gray-900 dark:text-white">
                        7598FD14A9B37C3E
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Fingerprint
                      </label>
                      <div className="mt-1 text-sm font-mono break-all text-gray-900 dark:text-white">
                        F9C6 B2E3 AA51 D78F E34F 9A4C 7598 FD14 A9B3 7C3E
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                        Public Key
                      </label>
                      <div className="mt-1">
                        <textarea
                          readOnly
                          value={publicKey}
                          rows={5}
                          className="w-full text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3"
                        />
                      </div>
                      <div className="mt-2">
                        <button 
                          type="button"
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          onClick={() => navigator.clipboard.writeText(publicKey)}
                        >
                          Copy to Clipboard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2 text-primary-500" /> 
                  Security Settings
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Two-Factor Authentication
                        </label>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Enabled
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Your account is secured with hardware key authentication.
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Session Management
                        </label>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        You have 1 active session.
                      </p>
                      <button className="mt-2 text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400">
                        View all devices
                      </button>
                    </div>
                    
                    <div>
                      <div className="flex justify-between">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Login History
                        </label>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Last login: Today at 2:15 PM
                      </p>
                      <button className="mt-2 text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400">
                        View login history
                      </button>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 mt-6 flex items-center">
                  <BellIcon className="h-5 w-5 mr-2 text-primary-500" /> 
                  Notification Preferences
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="email-notifications"
                          name="email-notifications"
                          type="checkbox"
                          defaultChecked={true}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="email-notifications" className="font-medium text-gray-700 dark:text-gray-300">Email notifications</label>
                        <p className="text-gray-500 dark:text-gray-400">Receive notifications about account activity.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="security-alerts"
                          name="security-alerts"
                          type="checkbox"
                          defaultChecked={true}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="security-alerts" className="font-medium text-gray-700 dark:text-gray-300">Security alerts</label>
                        <p className="text-gray-500 dark:text-gray-400">Receive alerts about important security events.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="marketing-emails"
                          name="marketing-emails"
                          type="checkbox"
                          defaultChecked={false}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="marketing-emails" className="font-medium text-gray-700 dark:text-gray-300">Marketing emails</label>
                        <p className="text-gray-500 dark:text-gray-400">Receive updates about new features and promotions.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}