'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  ArrowLeftIcon, 
  ReplyIcon, 
  ArchiveBoxIcon, 
  TrashIcon, 
  EyeIcon, 
  LockClosedIcon,
  DocumentTextIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';

export default function EmailDetail({ message, onBack }) {
  const [decrypted, setDecrypted] = useState(false);
  
  const formattedDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM d, yyyy h:mm a');
  };

  // Simulated PGP decryption
  const handleDecrypt = () => {
    // In a real app, this would trigger PGP decryption
    setDecrypted(true);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          
          <div className="flex space-x-2">
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <ReplyIcon className="h-4 w-4 mr-1.5" />
              Reply
            </button>
            <button
              type="button"
              className="inline-flex items-center px-2 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <ArchiveBoxIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex items-center px-2 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <h3 className="mt-4 text-lg font-medium leading-6 text-gray-900 dark:text-white">
          {message.subject}
        </h3>
        
        {message.labels?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.labels.map(label => (
              <span 
                key={label} 
                className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-800/40 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:text-primary-200"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Sender info */}
      <div className="px-4 py-3 sm:px-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex justify-between">
          <div>
            <div className="flex items-center">
              <img
                className="h-8 w-8 rounded-full mr-2"
                src={`https://ui-avatars.com/api/?name=${message.from.name.replace(' ', '+')}&background=0D9488&color=fff`}
                alt={message.from.name}
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {message.from.name}
                  {message.encryptedBody && (
                    <LockClosedIcon className="inline ml-1.5 h-4 w-4 text-primary-600 dark:text-primary-400" />
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {message.from.email}
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formattedDate(message.timestamp)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              To: {message.to.email}
            </p>
          </div>
        </div>
      </div>
      
      {/* Email body */}
      <div className="px-4 py-5 sm:px-6">
        {message.encryptedBody && !decrypted ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="mb-4 bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
              <LockClosedIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
              This message is encrypted with PGP. Only you can read its contents.
            </p>
            <button
              type="button"
              onClick={handleDecrypt}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Decrypt Message
            </button>
          </div>
        ) : (
          <div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300">
                {message.encryptedBody && decrypted ? (
                  <span>
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs p-2 rounded-md mb-4 flex items-center">
                      <LockClosedIcon className="h-4 w-4 mr-1" />
                      This message was decrypted with your private key
                    </div>
                    <p>Hello,</p>
                    <p>{message.snippet.endsWith('...') ? message.snippet.slice(0, -3) : message.snippet}</p>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, urna eu tincidunt consectetur, nisl nunc euismod nisi, eu porttitor nisl nisi eu nisi. Sed euismod, urna eu tincidunt consectetur, nisl nunc euismod nisi, eu porttitor nisl nisi eu nisi.</p>
                    <p>Best regards,<br/>{message.from.name}</p>
                  </span>
                ) : (
                  message.snippet
                )}
              </p>
            </div>
            
            {/* Attachments */}
            {message.attachments?.length > 0 && (
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Attachments ({message.attachments.length})
                </div>
                <div className="space-y-2">
                  {message.attachments.map((attachment, index) => (
                    <div 
                      key={index}
                      className="flex items-center p-2 rounded-md border border-gray-200 dark:border-gray-700"
                    >
                      <div className="mr-3 bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                        <DocumentTextIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{attachment.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(attachment.size / 1000).toFixed(1)} KB
                        </p>
                      </div>
                      <button 
                        type="button"
                        className="ml-4 px-3 py-1.5 text-xs font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 dark:text-primary-400 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 transition-colors"
                      >
                        <PaperClipIcon className="h-4 w-4 inline mr-1" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}