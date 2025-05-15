'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  XMarkIcon, 
  PaperClipIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  LockClosedIcon, 
  LockOpenIcon,
  MinusIcon,
  PlusIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { sendEmail } from '@/lib/mail/mailbox';
import { getCurrentUserEmail } from '@/lib/auth/getCurrentUser';

export default function ComposeEmail({ 
  onClose, 
  initialData = {}, 
  mode = 'new' // new, reply, forward
}) {
  const [minimized, setMinimized] = useState(false);
  const [isPgpEncrypted, setIsPgpEncrypted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userPublicKey, setUserPublicKey] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [formData, setFormData] = useState({
    to: initialData.to || '',
    cc: initialData.cc || '',
    bcc: initialData.bcc || '',
    subject: initialData.subject || '',
    body: initialData.body || '',
    attachments: initialData.attachments || []
  });
  const [showCc, setShowCc] = useState(!!initialData.cc);
  const [showBcc, setShowBcc] = useState(!!initialData.bcc);
  const attachmentInputRef = useRef(null);
  
  // Initialize based on mode
  useEffect(() => {
    if (mode === 'reply' && initialData.replyTo) {
      setFormData({
        ...formData,
        to: initialData.replyTo.email,
        subject: initialData.subject.startsWith('Re:') 
          ? initialData.subject 
          : `Re: ${initialData.subject}`,
        body: `\n\n---\nOn ${new Date(initialData.date).toLocaleString()}, ${initialData.replyTo.name || initialData.replyTo.email} wrote:\n\n${initialData.originalBody || ''}`,
      });
    } else if (mode === 'forward' && initialData.originalBody) {
      setFormData({
        ...formData,
        subject: initialData.subject.startsWith('Fwd:') 
          ? initialData.subject 
          : `Fwd: ${initialData.subject}`,
        body: `\n\n---\n---------- Forwarded message ---------\nFrom: ${initialData.from?.name || initialData.from?.email || ''} <${initialData.from?.email || ''}>\nDate: ${new Date(initialData.date).toLocaleString()}\nSubject: ${initialData.subject}\nTo: ${Array.isArray(initialData.to) ? initialData.to.map(r => `${r.name || r.email} <${r.email}>`).join(', ') : ''}\n\n${initialData.originalBody}`,
        attachments: initialData.attachments || []
      });
    }
  }, [mode, initialData]);
  
  // Fetch the user's email and public key
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.warn('No auth token available for fetching user data');
          return;
        }
        
        // Get user email
        const email = localStorage.getItem('userEmail');
        if (email) {
          console.log('Using email from localStorage:', email);
          setUserEmail(email);
        } else {
          // Try to get email using getCurrentUserEmail
          const currentEmail = getCurrentUserEmail();
          if (currentEmail) {
            console.log('Using email from getCurrentUserEmail:', currentEmail);
            setUserEmail(currentEmail);
          } else {
            console.warn('No user email found in localStorage or getCurrentUserEmail');
          }
        }
        
        // Try to fetch public key from API
        const response = await fetch('/api/user/public-key', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.publicKey) {
            console.log('Successfully fetched public key for attachment');
            setUserPublicKey(data.publicKey);
            localStorage.setItem('user_public_key', data.publicKey);
          }
        } else {
          // If API fails, try to get from localStorage
          const storedKey = localStorage.getItem('user_public_key');
          if (storedKey) {
            console.log('Using public key from localStorage');
            setUserPublicKey(storedKey);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        
        // Try localStorage as fallback
        const storedKey = localStorage.getItem('user_public_key');
        if (storedKey) {
          console.log('Using public key from localStorage after API error');
          setUserPublicKey(storedKey);
        }
      }
    };
    
    fetchUserData();
  }, []);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle file attachment
  const handleAttachment = (e) => {
    const files = Array.from(e.target.files);
    
    // Create attachment objects
    const newAttachments = files.map(file => ({
      id: `temp-${Math.random().toString(36).substring(7)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file // Keep the File object for later upload
    }));
    
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...newAttachments]
    });
    
    // Reset the file input
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  };
  
  // Remove an attachment
  const handleRemoveAttachment = (attachmentId) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter(att => att.id !== attachmentId)
    });
  };
  
  // Send the email
  const handleSend = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Basic validation
      if (!formData.to) {
        throw new Error('Please specify at least one recipient');
      }
      
      // Split recipient strings into arrays
      const toArray = formData.to.split(',').map(email => ({
        email: email.trim(),
        name: '' // In a real app, we'd extract names from "Name <email>" format
      }));
      
      const ccArray = formData.cc
        ? formData.cc.split(',').map(email => ({
            email: email.trim(),
            name: ''
          }))
        : [];
        
      const bccArray = formData.bcc
        ? formData.bcc.split(',').map(email => ({
            email: email.trim(),
            name: ''
          }))
        : [];
      
      // Create attachments list including public key
      const allAttachments = [...formData.attachments];
      
      // Add public key attachment if available
      if (userPublicKey) {
        console.log('Attaching public PGP key to email');
        allAttachments.push({
          id: 'public-key-attachment',
          name: 'public_key.asc',
          content: userPublicKey,
          contentType: 'application/pgp-keys',
          size: userPublicKey.length
        });
      } else {
        console.log('No public key available to attach');
      }
      
      // Create email data
      const emailData = {
        from: {
          email: userEmail || localStorage.getItem('userEmail') || 'no-reply@keykeeper.world',
          name: localStorage.getItem('userName') || 'KeyKeeper User'
        },
        to: toArray,
        cc: ccArray,
        bcc: bccArray,
        subject: formData.subject,
        body: formData.body,
        attachments: allAttachments,
        pgpEncrypted: isPgpEncrypted
      };
      
      // Handle file attachments by converting them to base64
      if (formData.attachments && formData.attachments.length > 0) {
        for (let i = 0; i < formData.attachments.length; i++) {
          const attachment = formData.attachments[i];
          if (attachment.file) {
            // We need to handle file conversion on the client side
            // For now, we'll just log that we can't send attachments
            console.warn('File attachments not supported in this demo');
            // In a full implementation, we'd convert the file to base64 here
          }
        }
      }
      
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // First check authentication status
      console.log('Checking authentication status before sending email...');
      const authCheckResponse = await fetch('/api/diagnostics/auth-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (authCheckResponse.ok) {
        const authStatus = await authCheckResponse.json();
        console.log('Authentication status:', authStatus);
        
        if (authStatus.status !== 'authenticated') {
          throw new Error(`Authentication check failed: ${authStatus.status}`);
        }
      } else {
        console.warn('Auth status check failed:', authCheckResponse.status);
      }
      
      // Send the email using the API instead of the direct function
      const response = await fetch('/api/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emailData),
      });
      
      // Handle non-200 responses before parsing JSON
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error(`Authentication error (${response.status}) when sending email`);
          
          try {
            // Try to read the response text - this will work even if it's HTML
            const text = await response.text();
            console.error('Error response:', text.substring(0, 500) + '...');
            
            // Check if response is HTML (indicates a server error page)
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
              throw new Error('Server returned an HTML error page instead of JSON. This usually indicates a server-side issue.');
            }
            
            // Try to parse as JSON if it might be JSON
            try {
              const errorData = JSON.parse(text);
              throw new Error(errorData.error || 'Authentication error. Please log in again.');
            } catch (parseError) {
              // Not valid JSON
              throw new Error('Authentication error. Please log in again.');
            }
          } catch (readError) {
            throw new Error('Authentication error. Please log in again.');
          }
        }
        
        // For other error status codes, try to get error details from the response
        try {
          // Try to read the response text first
          const text = await response.text();
          console.error('Error response for status', response.status, ':', text.substring(0, 500) + '...');
          
          // Check if response is HTML
          if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
            throw new Error('Server returned an HTML error page instead of JSON. This usually indicates a server-side issue.');
          }
          
          // Try to parse as JSON
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.error || `Failed to send email: ${response.statusText}`);
          } catch (parseError) {
            throw new Error(`Failed to send email: ${response.statusText}`);
          }
        } catch (error) {
          // If we can't read the response at all
          throw new Error(`Failed to send email: ${response.statusText}`);
        }
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      console.log('Email sent successfully:', result);
      
      // Close the composer on success
      onClose();
    } catch (err) {
      console.error('Error sending email:', err);
      
      // Handle specific error types
      if (err.message.includes('Authentication') || err.message.includes('token')) {
        setError('Authentication error. Please log in again to continue.');
      } else {
        setError(err.message || 'Failed to send email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get title based on mode
  const getTitle = () => {
    switch(mode) {
      case 'reply': return 'Reply';
      case 'forward': return 'Forward';
      default: return 'New Message';
    }
  };
  
  // Render minimized view
  if (minimized) {
    return (
      <div className="fixed bottom-0 right-6 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-t-lg border border-gray-300 dark:border-gray-700 z-50">
        <div className="p-3 flex items-center justify-between bg-gray-100 dark:bg-gray-900 cursor-pointer rounded-t-lg" onClick={() => setMinimized(false)}>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {formData.subject || getTitle()}
          </h3>
          <div className="flex space-x-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setMinimized(false);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ChevronUpIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-0 right-6 w-[36rem] bg-white dark:bg-gray-800 shadow-xl rounded-t-lg border border-gray-300 dark:border-gray-700 z-50 flex flex-col max-h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="p-3 flex items-center justify-between bg-gray-100 dark:bg-gray-900 rounded-t-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          {getTitle()}
        </h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setMinimized(true)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <MinusIcon className="h-5 w-5" />
          </button>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Form content */}
      <div className="p-4 flex-1 overflow-y-auto">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
        
        {/* Recipients */}
        <div className="mb-3">
          <div className="flex items-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-10">To:</label>
            <input
              type="text"
              name="to"
              value={formData.to}
              onChange={handleChange}
              className="block w-full border-0 p-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-0 sm:text-sm bg-transparent"
              placeholder="Recipients"
            />
            <button
              type="button"
              onClick={() => {
                setShowCc(!showCc);
                setShowBcc(!showCc);
              }}
              className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Cc/Bcc
            </button>
          </div>
          <div className="border-b border-gray-200 dark:border-gray-700 my-2"></div>
        </div>
        
        {showCc && (
          <div className="mb-3">
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-10">Cc:</label>
              <input
                type="text"
                name="cc"
                value={formData.cc}
                onChange={handleChange}
                className="block w-full border-0 p-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-0 sm:text-sm bg-transparent"
                placeholder="Carbon copy recipients"
              />
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700 my-2"></div>
          </div>
        )}
        
        {showBcc && (
          <div className="mb-3">
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-10">Bcc:</label>
              <input
                type="text"
                name="bcc"
                value={formData.bcc}
                onChange={handleChange}
                className="block w-full border-0 p-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-0 sm:text-sm bg-transparent"
                placeholder="Blind carbon copy recipients"
              />
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700 my-2"></div>
          </div>
        )}
        
        {/* Subject */}
        <div className="mb-3">
          <div className="flex items-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-10 flex-shrink-0">Subject:</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="block w-full border-0 p-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-0 sm:text-sm bg-transparent truncate"
              placeholder="Subject"
              style={{ textOverflow: 'ellipsis' }}
            />
          </div>
          <div className="border-b border-gray-200 dark:border-gray-700 my-2"></div>
        </div>
        
        {/* Body */}
        <div className="mb-3">
          <textarea
            name="body"
            rows={12}
            value={formData.body}
            onChange={handleChange}
            className="block w-full border-0 py-0 resize-none text-gray-900 dark:text-white placeholder-gray-500 focus:ring-0 sm:text-sm bg-transparent focus:outline-none"
            placeholder="Write your message here..."
            style={{ border: 'none', boxShadow: 'none' }}
          />
        </div>
        
        {/* Attachments */}
        {formData.attachments.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Attachments
              </span>
            </div>
            <div className="space-y-2">
              {formData.attachments.map((attachment) => (
                <div 
                  key={attachment.id}
                  className="flex items-center justify-between rounded-md bg-gray-50 dark:bg-gray-700 p-2"
                >
                  <div className="flex items-center space-x-2">
                    <PaperClipIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white truncate max-w-xs">
                      {attachment.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(attachment.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Security info */}
        <div className="mt-4 rounded-md bg-gray-50 dark:bg-gray-700 p-3">
          <div className="flex items-center">
            {isPgpEncrypted ? (
              <LockClosedIcon className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <LockOpenIcon className="h-5 w-5 text-yellow-500 mr-2" />
            )}
            <div className="text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                {isPgpEncrypted ? 'End-to-end encrypted' : 'Not encrypted'}
              </span>
              <p className="text-gray-500 dark:text-gray-400">
                {isPgpEncrypted
                  ? 'This message will be encrypted with the recipient\'s public key.'
                  : 'No public key found for some recipients. Message will be sent unencrypted.'}
              </p>
              
              {userPublicKey && (
                <div className="flex items-center mt-2 text-primary-600 dark:text-primary-400">
                  <KeyIcon className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium">Your public key will be attached automatically</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsPgpEncrypted(!isPgpEncrypted)}
              className="ml-auto text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
            >
              {isPgpEncrypted ? 'Disable' : 'Enable'} encryption
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <PaperClipIcon className="h-4 w-4 mr-1" />
            Attach
          </button>
          <input
            type="file"
            ref={attachmentInputRef}
            onChange={handleAttachment}
            className="hidden"
            multiple
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                setIsLoading(true);
                setError(null);
                const token = localStorage.getItem('auth_token');
                if (!token) {
                  throw new Error('No auth token found');
                }
                
                // Use our simplified test endpoint
                const response = await fetch('/api/diagnostics/mail-test', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    from: { email: 'test@example.com' },
                    to: [{ email: 'recipient@example.com' }]
                  })
                });
                
                const result = await response.text();
                console.log('Test endpoint response:', result);
                
                try {
                  const jsonResult = JSON.parse(result);
                  if (jsonResult.success) {
                    setError('Test succeeded! Check console for details.');
                  } else {
                    setError(`Test failed: ${jsonResult.error}`);
                  }
                } catch (e) {
                  setError(`Test returned non-JSON response: ${result.substring(0, 100)}...`);
                }
              } catch (err) {
                console.error('Test failed:', err);
                setError(`Test error: ${err.message}`);
              } finally {
                setIsLoading(false);
              }
            }}
            className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Test API
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
            className={`inline-flex items-center rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-white ${
              isLoading
                ? 'bg-primary-400 dark:bg-primary-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600'
            }`}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}