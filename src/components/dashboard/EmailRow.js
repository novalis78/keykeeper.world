'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { LockClosedIcon, PaperClipIcon } from '@heroicons/react/20/solid';

export default function EmailRow({ message, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const formattedDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(date, 'h:mm a');
    } else {
      return format(date, 'MMM d');
    }
  };

  return (
    <div 
      className={`${
        message.read ? 'bg-white dark:bg-gray-800' : 'bg-primary-50 dark:bg-primary-900/20'
      } flex items-center py-3 px-4 cursor-pointer border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Sender and subject */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <p className={`text-sm font-medium truncate mr-2 ${message.read ? 'text-gray-900 dark:text-gray-200' : 'text-gray-900 dark:text-white'}`}>
            {message.from.name}
            {message.encryptedBody && (
              <LockClosedIcon className="inline ml-1.5 h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
            )}
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
            {`<${message.from.email}>`}
          </span>
          
          {/* Labels */}
          <div className="ml-2 hidden md:flex space-x-1">
            {message.labels?.map(label => (
              <span 
                key={label} 
                className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-800/40 px-2 py-0.5 text-xs font-medium text-primary-800 dark:text-primary-200"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-center">
          <p className="text-sm truncate mr-1 text-gray-700 dark:text-gray-300">
            {message.subject}
          </p>
          <span className="text-sm truncate text-gray-500 dark:text-gray-400">
            - {message.snippet}
          </span>
        </div>
      </div>
      
      {/* Metadata */}
      <div className="ml-4 flex-shrink-0 flex flex-col items-end space-y-1">
        <div className="flex items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formattedDate(message.timestamp)}
          </span>
          
          {message.attachments?.length > 0 && (
            <PaperClipIcon className="ml-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
          )}
        </div>
        
        <span className="text-xs text-gray-500 dark:text-gray-400">
          via {message.to.email.split('@')[0]}
        </span>
      </div>
    </div>
  );
}