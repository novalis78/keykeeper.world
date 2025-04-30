'use client';

import { useState } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { EnvelopeIcon, PaperAirplaneIcon, XMarkIcon, PaperClipIcon } from '@heroicons/react/24/outline';

export default function ComposePage() {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: '',
    attachments: []
  });
  const [sendingStatus, setSendingStatus] = useState('idle'); // idle, sending, success, error
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailData({
      ...emailData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!emailData.to || !emailData.subject || !emailData.message) {
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
        to: '',
        subject: '',
        message: '',
        attachments: []
      });
      
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
                </div>
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