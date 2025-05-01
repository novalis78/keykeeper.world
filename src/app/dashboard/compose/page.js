'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { EnvelopeIcon, PaperAirplaneIcon, XMarkIcon, PaperClipIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { LockClosedIcon } from '@heroicons/react/24/solid';

export default function ComposePage() {
  const [userEmailAccounts, setUserEmailAccounts] = useState([]);
  const [emailData, setEmailData] = useState({
    from: '',
    to: '',
    subject: '',
    message: '',
    attachments: []
  });
  const [sendingStatus, setSendingStatus] = useState('idle'); // idle, sending, success, error
  const [encryptionStatus, setEncryptionStatus] = useState('unknown'); // unknown, available, unavailable
  
  // Fetch user's email accounts
  useEffect(() => {
    const fetchUserEmailAccounts = async () => {
      try {
        // In a real implementation, this would fetch from the API
        // For now, we'll use mock data
        const mockAccounts = [
          { id: 1, email: 'user@keykeeper.world', name: 'Primary Account', isDefault: true },
          { id: 2, email: 'admin@keykeeper.world', name: 'Admin Account', isDefault: false },
          { id: 3, email: 'business@phoneshield.ai', name: 'Business Account', isDefault: false }
        ];
        
        setUserEmailAccounts(mockAccounts);
        
        // Set default From address
        const defaultAccount = mockAccounts.find(account => account.isDefault) || mockAccounts[0];
        if (defaultAccount) {
          setEmailData(prev => ({ ...prev, from: defaultAccount.id.toString() }));
        }
      } catch (error) {
        console.error('Error fetching user email accounts:', error);
      }
    };
    
    fetchUserEmailAccounts();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailData({
      ...emailData,
      [name]: value
    });
    
    // Check encryption status when recipient email changes
    if (name === 'to' && value) {
      checkEncryptionStatus(value);
    }
  };
  
  // Simulate checking if the recipient has a public key available
  const checkEncryptionStatus = (email) => {
    // In a real implementation, this would query the server for available public keys
    // For mock data, we'll pretend certain domains have keys available
    setTimeout(() => {
      if (email.endsWith('@keykeeper.world') || email.endsWith('@phoneshield.ai') || email.includes('secure')) {
        setEncryptionStatus('available');
      } else {
        setEncryptionStatus('unavailable');
      }
    }, 500);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!emailData.from || !emailData.to || !emailData.subject || !emailData.message) {
      alert('Please fill in all required fields');
      return;
    }
    
    setSendingStatus('sending');
    
    try {
      // In a real implementation, this would send the email via an API
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form after successful submission
      setEmailData({
        from: emailData.from, // Keep the from address
        to: '',
        subject: '',
        message: '',
        attachments: []
      });
      
      setEncryptionStatus('unknown');
      
      setSendingStatus('success');
      
      // Reset success status after 3 seconds
      setTimeout(() => {
        setSendingStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Error sending email:', error);
      setSendingStatus('error');
    }
  };
  
  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compose Message</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Write and send a new secure email
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="from" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="from"
                    id="from"
                    value={emailData.from}
                    onChange={handleInputChange}
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    required
                  >
                    <option value="">Select an email address</option>
                    {userEmailAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.email} {account.isDefault ? '(Default)' : ''} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="to"
                    id="to"
                    value={emailData.to}
                    onChange={handleInputChange}
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    placeholder="recipient@example.com"
                    required
                  />
                  
                  {/* Encryption status indicator */}
                  {emailData.to && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {encryptionStatus === 'available' ? (
                        <div className="flex items-center text-green-500 dark:text-green-400">
                          <LockClosedIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Encrypted</span>
                        </div>
                      ) : encryptionStatus === 'unavailable' ? (
                        <div className="flex items-center text-amber-500 dark:text-amber-400">
                          <ShieldCheckIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Not encrypted</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                {encryptionStatus === 'unavailable' && (
                  <p className="mt-1 text-xs text-amber-500 dark:text-amber-400">
                    No PGP key found for this recipient. The message will not be end-to-end encrypted.
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  value={emailData.subject}
                  onChange={handleInputChange}
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Email subject"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={12}
                  value={emailData.message}
                  onChange={handleInputChange}
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Write your message here..."
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                >
                  <PaperClipIcon className="h-5 w-5 mr-2 text-gray-400" aria-hidden="true" />
                  Attach File
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {emailData.attachments.length > 0 
                    ? `${emailData.attachments.length} files attached` 
                    : 'No files attached'}
                </span>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <div>
                {sendingStatus === 'success' && (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <span className="text-sm font-medium">Message sent successfully!</span>
                  </div>
                )}
                {sendingStatus === 'error' && (
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <span className="text-sm font-medium">Error sending message. Please try again.</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                >
                  <XMarkIcon className="h-5 w-5 mr-2 text-gray-400" aria-hidden="true" />
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={sendingStatus === 'sending'}
                  className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    sendingStatus === 'sending'
                      ? 'bg-primary-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 focus:outline-none'
                  }`}
                >
                  <PaperAirplaneIcon className="h-5 w-5 mr-2 transform rotate-90" aria-hidden="true" />
                  {sendingStatus === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}