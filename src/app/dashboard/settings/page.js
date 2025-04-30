'use client';

import { useState } from 'react';
import { CogIcon, LockClosedIcon, BellIcon, PaintBrushIcon, EnvelopeIcon, ServerIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  
  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'security', name: 'Security', icon: LockClosedIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
    { id: 'mail', name: 'Mail Settings', icon: EnvelopeIcon },
    { id: 'domains', name: 'Domains', icon: ServerIcon },
  ];
  
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="xl:grid xl:grid-cols-4">
          {/* Navigation sidebar */}
          <div className="xl:col-span-1 xl:border-r xl:border-gray-200 dark:xl:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <nav className="px-4 py-5">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                    >
                      <tab.icon
                        className={`mr-3 h-5 w-5 ${
                          activeTab === tab.id
                            ? 'text-primary-500'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      />
                      {tab.name}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          
          {/* Settings content */}
          <div className="xl:col-span-3 px-4 py-5 sm:p-6">
            {activeTab === 'general' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">General Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        defaultValue="User"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        defaultValue="user@example.com"
                        disabled
                        className="bg-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Email address cannot be changed. It is tied to your PGP key.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Language
                    </label>
                    <div className="mt-1">
                      <select
                        id="language"
                        name="language"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        defaultValue="en"
                      >
                        <option value="en">English</option>
                        <option value="de">German</option>
                        <option value="fr">French</option>
                        <option value="es">Spanish</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Timezone
                    </label>
                    <div className="mt-1">
                      <select
                        id="timezone"
                        name="timezone"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        defaultValue="utc"
                      >
                        <option value="utc">UTC</option>
                        <option value="est">Eastern Time (ET)</option>
                        <option value="cst">Central Time (CT)</option>
                        <option value="mst">Mountain Time (MT)</option>
                        <option value="pst">Pacific Time (PT)</option>
                        <option value="cet">Central European Time (CET)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Authentication Methods</h3>
                    
                    <div className="mt-4 space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <LockClosedIcon className="h-5 w-5 text-primary-500 mr-3" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">PGP Key Authentication</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Sign in using your PGP private key
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <ServerIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Hardware Security Key</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Use a YubiKey or similar hardware security device
                              </p>
                            </div>
                          </div>
                          <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 dark:text-primary-300 dark:bg-primary-900/30 dark:hover:bg-primary-900/50">
                            Enable
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sessions</h3>
                    
                    <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div className="px-4 py-5 sm:p-6">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Active Sessions</h4>
                        
                        <ul className="mt-3 divide-y divide-gray-200 dark:divide-gray-600">
                          <li className="py-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <CogIcon className="h-6 w-6 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  Current Session
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  Started 2 hours ago • Chrome on Windows
                                </p>
                              </div>
                              <div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Current
                                </span>
                              </div>
                            </div>
                          </li>
                        </ul>
                        
                        <div className="mt-5">
                          <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Sign out of all other sessions
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Advanced Security</h3>
                    
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="login-notifications"
                            name="login-notifications"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="login-notifications" className="font-medium text-gray-700 dark:text-gray-300">Email me about new sign-ins</label>
                          <p className="text-gray-500 dark:text-gray-400">Get notified when there's a sign-in from a new device or browser.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="failed-attempts"
                            name="failed-attempts"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="failed-attempts" className="font-medium text-gray-700 dark:text-gray-300">Alert on suspicious activity</label>
                          <p className="text-gray-500 dark:text-gray-400">Get notified about failed login attempts or other suspicious activities.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</h3>
                    
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="new-email"
                            name="new-email"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="new-email" className="font-medium text-gray-700 dark:text-gray-300">New email received</label>
                          <p className="text-gray-500 dark:text-gray-400">Get notified when you receive a new email.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="account-activity"
                            name="account-activity"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="account-activity" className="font-medium text-gray-700 dark:text-gray-300">Account activity</label>
                          <p className="text-gray-500 dark:text-gray-400">Updates about your account, settings changes, etc.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="security-updates"
                            name="security-updates"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="security-updates" className="font-medium text-gray-700 dark:text-gray-300">Security updates</label>
                          <p className="text-gray-500 dark:text-gray-400">Important security-related notifications and alerts.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="product-updates"
                            name="product-updates"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="product-updates" className="font-medium text-gray-700 dark:text-gray-300">Product updates</label>
                          <p className="text-gray-500 dark:text-gray-400">Updates about new features and improvements.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="marketing"
                            name="marketing"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="marketing" className="font-medium text-gray-700 dark:text-gray-300">Marketing emails</label>
                          <p className="text-gray-500 dark:text-gray-400">Promotions, discounts, and newsletter content.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notification Frequency</h3>
                    
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          id="freq-immediate"
                          name="notification-frequency"
                          type="radio"
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                          defaultChecked
                        />
                        <label htmlFor="freq-immediate" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Immediate
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="freq-daily"
                          name="notification-frequency"
                          type="radio"
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                        />
                        <label htmlFor="freq-daily" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Daily digest
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="freq-weekly"
                          name="notification-frequency"
                          type="radio"
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                        />
                        <label htmlFor="freq-weekly" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Weekly digest
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</h3>
                    
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="relative">
                        <input
                          type="radio"
                          name="theme"
                          id="theme-light"
                          value="light"
                          className="sr-only"
                          defaultChecked
                        />
                        <label
                          htmlFor="theme-light"
                          className="block cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-4 text-center"
                        >
                          <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-900">
                              <PaintBrushIcon className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">Light</span>
                          </div>
                        </label>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="radio"
                          name="theme"
                          id="theme-dark"
                          value="dark"
                          className="sr-only"
                        />
                        <label
                          htmlFor="theme-dark"
                          className="block cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-4 text-center"
                        >
                          <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center text-white">
                              <PaintBrushIcon className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">Dark</span>
                          </div>
                        </label>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="radio"
                          name="theme"
                          id="theme-system"
                          value="system"
                          className="sr-only"
                        />
                        <label
                          htmlFor="theme-system"
                          className="block cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-4 text-center"
                        >
                          <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-900 border border-gray-300 flex items-center justify-center text-gray-900">
                              <PaintBrushIcon className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">System</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Density</h3>
                    
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          id="density-comfortable"
                          name="density"
                          type="radio"
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                          defaultChecked
                        />
                        <label htmlFor="density-comfortable" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Comfortable
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="density-compact"
                          name="density"
                          type="radio"
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                        />
                        <label htmlFor="density-compact" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Compact
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Font Size</h3>
                    
                    <div className="mt-4">
                      <select
                        id="font-size"
                        name="font-size"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        defaultValue="medium"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'mail' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Mail Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Display</h3>
                    
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="show-images"
                            name="show-images"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="show-images" className="font-medium text-gray-700 dark:text-gray-300">Always show external images</label>
                          <p className="text-gray-500 dark:text-gray-400">Automatically load images in emails from all senders.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="show-snippets"
                            name="show-snippets"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="show-snippets" className="font-medium text-gray-700 dark:text-gray-300">Show email previews</label>
                          <p className="text-gray-500 dark:text-gray-400">Show a snippet of the email content in the inbox view.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="conversation-view"
                            name="conversation-view"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="conversation-view" className="font-medium text-gray-700 dark:text-gray-300">Conversation view</label>
                          <p className="text-gray-500 dark:text-gray-400">Group messages with the same subject as conversations.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sending</h3>
                    
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="auto-pgp"
                            name="auto-pgp"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="auto-pgp" className="font-medium text-gray-700 dark:text-gray-300">Automatically encrypt with PGP</label>
                          <p className="text-gray-500 dark:text-gray-400">Encrypt emails when possible based on recipient's public keys.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="attach-key"
                            name="attach-key"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="attach-key" className="font-medium text-gray-700 dark:text-gray-300">Attach public key to messages</label>
                          <p className="text-gray-500 dark:text-gray-400">Include your public key with outgoing emails.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="send-confirm"
                            name="send-confirm"
                            type="checkbox"
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="send-confirm" className="font-medium text-gray-700 dark:text-gray-300">Confirm before sending</label>
                          <p className="text-gray-500 dark:text-gray-400">Show a confirmation dialog before sending emails.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Signature</h3>
                    
                    <div className="mt-4">
                      <div>
                        <label htmlFor="signature" className="sr-only">Email signature</label>
                        <div className="mt-1">
                          <textarea
                            id="signature"
                            name="signature"
                            rows={4}
                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                            defaultValue="Best regards,&#10;[Your Name]&#10;&#10;Sent via KeyKeeper.world - Secure Email for Everyone"
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          HTML formatting is supported in your signature.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'domains' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Domain Settings</h2>
                
                <div className="text-center py-4">
                  <Link 
                    href="/mail/domains"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Go to Domain Management
                  </Link>
                  
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Manage your email domains, DNS records, and email accounts.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}