'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  ArrowUturnLeftIcon, 
  ArchiveBoxIcon, 
  TrashIcon, 
  EyeIcon, 
  LockClosedIcon,
  DocumentTextIcon,
  PaperClipIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon,
  EllipsisHorizontalIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

export default function EmailDetail({ message, onBack, onDelete }) {
  const [decrypted, setDecrypted] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const formattedDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM d, yyyy · h:mm a');
  };

  // Simulated PGP decryption
  const handleDecrypt = () => {
    // In a real app, this would trigger PGP decryption
    setDecrypted(true);
  };

  const toggleStar = () => {
    setIsStarred(!isStarred);
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this email?')) {
      setIsDeleting(true);
      try {
        // Call the delete function passed from the parent
        if (onDelete) {
          await onDelete(message.id);
        }
      } catch (error) {
        console.error('Error deleting email:', error);
        alert('Failed to delete the email. Please try again.');
        setIsDeleting(false);
      }
    }
  };
  
  return (
    <motion.div 
      className="bg-sidebar shadow rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            className="mr-4 inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          
          <h2 className="text-xl font-semibold text-white">{message.subject}</h2>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={toggleStar}
            className="inline-flex items-center p-2 text-gray-400 hover:text-yellow-400 transition-colors"
          >
            <StarIcon className={`h-5 w-5 ${isStarred ? 'text-yellow-400 fill-yellow-400' : ''}`} />
          </button>
          
          <button
            type="button"
            className="inline-flex items-center p-2 text-gray-400 hover:text-white transition-colors"
          >
            <FolderIcon className="h-5 w-5" />
          </button>
          
          <button
            type="button"
            className="inline-flex items-center p-2 text-gray-400 hover:text-white transition-colors"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Labels */}
      {message.labels?.length > 0 && (
        <div className="px-6 py-2 border-b border-gray-700 flex flex-wrap gap-1">
          {message.labels.map(label => (
            <span 
              key={label} 
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                ${label === 'important' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                  label === 'alert' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                  'bg-primary-100 dark:bg-primary-800/40 text-primary-800 dark:text-primary-300'}`}
            >
              {label}
            </span>
          ))}
        </div>
      )}
      
      {/* Sender info */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex justify-between items-start">
          <div className="flex">
            <div className="h-10 w-10 rounded-full bg-primary-600/30 mr-4 flex items-center justify-center text-base font-medium text-primary-400 uppercase">
              {message.from.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center">
                <p className="text-base font-medium text-white">
                  {message.from.name}
                  {message.encryptedBody && (
                    <LockClosedIcon className="inline ml-1.5 h-4 w-4 text-primary-400" />
                  )}
                </p>
                <a href={`mailto:${message.from.email}`} className="ml-2 text-xs text-gray-400 hover:text-primary-400">
                  &lt;{message.from.email}&gt;
                </a>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                To: {message.to.email}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-400">
              {formattedDate(message.timestamp)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Action toolbar */}
      <div className="px-6 py-3 border-b border-gray-700 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center px-3 py-1.5 border border-gray-700 rounded-md text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          <ArrowUturnLeftIcon className="h-4 w-4 mr-1.5" />
          Reply
        </button>
        
        <button
          type="button"
          className="inline-flex items-center px-3 py-1.5 border border-gray-700 rounded-md text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />
          Forward
        </button>
        
        <div className="flex-grow"></div>
        
        <button
          type="button"
          className="inline-flex items-center px-2 py-1.5 border border-gray-700 rounded-md text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          <ArchiveBoxIcon className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center px-2 py-1.5 border border-gray-700 rounded-md text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          {isDeleting ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <TrashIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      
      {/* Email body */}
      <div className="px-6 py-6">
        {message.encryptedBody && !decrypted ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <motion.div 
              className="mb-6 bg-primary-600/20 p-6 rounded-full"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <LockClosedIcon className="h-12 w-12 text-primary-400" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-3">
              This message is encrypted
            </h3>
            <p className="text-center text-gray-400 mb-6 max-w-md">
              Your message is protected with end-to-end encryption using OpenPGP. Only you can read its contents.
            </p>
            <motion.button
              type="button"
              onClick={handleDecrypt}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500 transition-colors shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              Decrypt Message
            </motion.button>
          </div>
        ) : (
          <div>
            {message.encryptedBody && decrypted && (
              <div className="bg-green-900/20 text-green-300 text-sm p-3 rounded-md mb-6 flex items-center">
                <LockClosedIcon className="h-5 w-5 mr-2 text-green-400" />
                This message was decrypted with your private key
              </div>
            )}
            
            <div className="prose dark:prose-invert max-w-none text-gray-300">
              {/* If we have HTML content, render it safely */}
              {message.html ? (
                <div dangerouslySetInnerHTML={{ __html: message.html }} />
              ) : (
                // Otherwise show text content with proper line breaks
                <div>
                  {(message.text || message.snippet || "No content available").split('\n').map((paragraph, idx) => (
                    <p key={idx} className="my-4">{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
            
            {/* Attachments */}
            {message.attachments?.length > 0 && (
              <div className="mt-8 border-t border-gray-700 pt-6">
                <div className="flex items-center text-base font-medium text-white mb-4">
                  <PaperClipIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Attachments ({message.attachments.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {message.attachments.map((attachment, index) => (
                    <div 
                      key={index}
                      className="flex items-center p-3 rounded-md border border-gray-700 bg-dashboard/60 group hover:bg-dashboard transition-colors"
                    >
                      <div className="mr-3 p-2 rounded-md bg-primary-600/20">
                        <DocumentTextIcon className="h-6 w-6 text-primary-400" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium truncate text-white">{attachment.name}</p>
                        <p className="text-xs text-gray-500">
                          {(attachment.size / 1000).toFixed(1)} KB
                        </p>
                      </div>
                      <button 
                        type="button"
                        className="ml-2 inline-flex items-center p-1.5 rounded-md text-gray-400 hover:text-primary-400 transition-colors"
                      >
                        <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}