'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { EnvelopeIcon, PaperAirplaneIcon, XMarkIcon, PaperClipIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { getCurrentUserId } from '@/lib/auth/getCurrentUser';

export default function ComposePage() {
  const [userEmailAccounts, setUserEmailAccounts] = useState([]);
  const [userPublicKey, setUserPublicKey] = useState(null);
  const [emailData, setEmailData] = useState({
    from: '',
    to: '',
    subject: '',
    message: '',
    attachments: []
  });
  const fileInputRef = useRef(null);
  const [sendingStatus, setSendingStatus] = useState('idle'); // idle, sending, success, error
  const [encryptionStatus, setEncryptionStatus] = useState('unknown'); // unknown, available, unavailable
  
  // Fetch user's email accounts from the virtual_users table
  // and also fetch the user's public key
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch the current user's email from the API
        const userId = await getCurrentUserId();
        if (!userId) {
          console.error('No user ID found');
          return;
        }
        
        // Get user email from virtual_users table
        const response = await fetch('/api/mail/user-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user email');
        }

        const data = await response.json();
        
        if (data.success && data.email) {
          // Create account object from real user email
          const userAccount = { 
            id: 1, 
            email: data.email, 
            name: 'Primary Account', 
            isDefault: true 
          };
          
          setUserEmailAccounts([userAccount]);
          
          // Set default From address
          setEmailData(prev => ({ ...prev, from: userAccount.id.toString() }));
          
          // Fetch the user's public key
          try {
            const publicKeyResponse = await fetch('/api/user/public-key', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              }
            });
            
            if (publicKeyResponse.ok) {
              const pkData = await publicKeyResponse.json();
              if (pkData.publicKey) {
                console.log('Public key fetched for automatic attachment');
                setUserPublicKey(pkData.publicKey);
              }
            } else {
              // Fallback to get public key from localStorage if available
              const storedPublicKey = localStorage.getItem('user_public_key');
              if (storedPublicKey) {
                console.log('Using public key from localStorage');
                setUserPublicKey(storedPublicKey);
              }
            }
          } catch (pkError) {
            console.error('Error fetching user public key:', pkError);
          }
        } else {
          console.warn('No email found for user, falling back to mock data');
          // Fallback to mock data if no real email found
          const mockAccounts = [
            { id: 1, email: 'user@keykeeper.world', name: 'Primary Account', isDefault: true },
            { id: 2, email: 'admin@keykeeper.world', name: 'Admin Account', isDefault: false }
          ];
          
          setUserEmailAccounts(mockAccounts);
          
          // Set default From address
          const defaultAccount = mockAccounts.find(account => account.isDefault) || mockAccounts[0];
          if (defaultAccount) {
            setEmailData(prev => ({ ...prev, from: defaultAccount.id.toString() }));
          }
        }
      } catch (error) {
        console.error('Error fetching user email accounts:', error);
        
        // Fallback to mock data on error
        const mockAccounts = [
          { id: 1, email: 'user@keykeeper.world', name: 'Primary Account', isDefault: true },
          { id: 2, email: 'admin@keykeeper.world', name: 'Admin Account', isDefault: false }
        ];
        
        setUserEmailAccounts(mockAccounts);
        
        // Set default From address
        const defaultAccount = mockAccounts.find(account => account.isDefault) || mockAccounts[0];
        if (defaultAccount) {
          setEmailData(prev => ({ ...prev, from: defaultAccount.id.toString() }));
        }
      }
    };
    
    fetchUserData();
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
      // Get the selected account
      const selectedAccount = userEmailAccounts.find(acc => acc.id.toString() === emailData.from.toString());
      if (!selectedAccount) {
        throw new Error('Invalid sending account selected');
      }
      
      console.log('Sending email from:', selectedAccount.email);
      
      // Handle file attachments if any
      let attachmentsToSend = [];
      if (emailData.attachments.length > 0) {
        attachmentsToSend = await Promise.all(emailData.attachments.map(async (att) => {
          // For files, we need to convert to base64
          if (att.file) {
            try {
              // Read file as base64
              const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(att.file);
              });
              
              return {
                filename: att.name,
                content: base64,
                encoding: 'base64',
                contentType: att.type
              };
            } catch (err) {
              console.error('Error processing attachment:', err);
              return null;
            }
          } else {
            // For attachments that don't have file objects (e.g., forwarded)
            return {
              filename: att.name,
              contentType: att.type
            };
          }
        }));
        
        // Filter out any null attachments (ones that failed to process)
        attachmentsToSend = attachmentsToSend.filter(Boolean);
      }
      
      // Automatically attach the user's public key as an attachment
      if (userPublicKey) {
        console.log('Attaching user public key to email');
        
        // The public key will be automatically attached as a .asc file
        attachmentsToSend.push({
          filename: 'public_key.asc',
          content: userPublicKey,
          contentType: 'application/pgp-keys'
        });
      } else {
        console.log('No public key available to attach');
        
        // Try one more time to get the public key from the API
        try {
          const publicKeyResponse = await fetch('/api/user/public-key', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });
          
          if (publicKeyResponse.ok) {
            const pkData = await publicKeyResponse.json();
            if (pkData.publicKey) {
              console.log('Public key fetched at last minute for attachment');
              
              // Add the newly retrieved public key as an attachment
              attachmentsToSend.push({
                filename: 'public_key.asc',
                content: pkData.publicKey,
                contentType: 'application/pgp-keys'
              });
              
              // Also save for future use
              setUserPublicKey(pkData.publicKey);
              localStorage.setItem('user_public_key', pkData.publicKey);
            }
          }
        } catch (lastMinuteError) {
          console.error('Last-minute attempt to fetch public key failed:', lastMinuteError);
        }
      }
      
      // Get mail credentials from localStorage
      // This is the same pattern used by the dashboard page for inbox fetching
      let credentials = null;
      
      try {
        console.log('=== KEYKEEPER: Attempting to retrieve stored mail credentials ===');
        
        // Generate account ID from email
        const accountId = `account_${selectedAccount.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        console.log(`Using account ID: ${accountId}`);
        
        // First try the direct storage method (no encryption)
        const directStorageKey = `kk_mail_${accountId}_direct`;
        const directCredentials = localStorage.getItem(directStorageKey);
        
        if (directCredentials) {
          console.log('Found direct credentials in localStorage!');
          credentials = JSON.parse(directCredentials);
          console.log('=== KEYKEEPER: Successfully retrieved mail credentials ===');
          console.log(`Using credentials for: ${credentials.email}`);
        } else {
          console.log('No direct credentials found in localStorage');
        }
      } catch (error) {
        console.error('Error retrieving mail credentials:', error);
      }
      
      // Format user's plain text message into a professional HTML template
      const formatEmailHTML = (plainText, fromName, fromEmail) => {
        // Escape HTML special chars to prevent XSS
        const escapeHtml = (text) => {
          return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        };
        
        // Convert plain text to HTML paragraphs
        const textToHtml = (text) => {
          return escapeHtml(text)
            .replace(/\n{2,}/g, '</p><p>') // Double newlines become new paragraphs
            .replace(/\n/g, '<br>');       // Single newlines become line breaks
        };
        
        // Create professional email template with left alignment
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${escapeHtml(emailData.subject)}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
                text-align: left;
              }
              .email-container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: left;
              }
              .email-header {
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eeeeee;
              }
              .email-content {
                margin-bottom: 20px;
                text-align: left;
              }
              .email-footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eeeeee;
                font-size: 12px;
                color: #888888;
              }
              h1, h2, h3, h4, h5, h6, p {
                margin: 0 0 15px;
                text-align: left;
              }
              a {
                color: #2b7de9;
                text-decoration: none;
              }
              .footer-logo {
                margin-bottom: 10px;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="email-header">
                <h2 style="margin-top:0; text-align:left;">${escapeHtml(emailData.subject)}</h2>
              </div>
              <div class="email-content">
                <p>${textToHtml(plainText)}</p>
              </div>
              <div class="email-footer">
                <div class="footer-logo">
                  <strong>KeyKeeper</strong> Secure Email
                </div>
                <p>Sent by ${escapeHtml(fromName)} (${fromEmail})</p>
                <p>This email was sent with end-to-end security by <a href="https://keykeeper.world">KeyKeeper</a>.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      };
      
      // Get sender name with fallback
      const senderName = selectedAccount.name || 'KeyKeeper User';
      
      // Prepare email data for API with proper formatting for optimal delivery
      const emailApiData = {
        from: {
          email: selectedAccount.email,
          name: senderName
        },
        to: [{ 
          email: emailData.to.trim(), 
          name: '' 
        }],
        subject: emailData.subject,
        // Use simple text version for the text field
        text: emailData.message,
        // Use formatted HTML template for the body
        body: formatEmailHTML(emailData.message, senderName, selectedAccount.email),
        pgpEncrypted: encryptionStatus === 'available',
        attachments: attachmentsToSend,
        // Include credentials if found
        credentials: credentials
      };
      
      console.log(`Sending as: ${senderName} <${selectedAccount.email}>`);
      
      // Get the auth token from localStorage
      const authToken = localStorage.getItem('auth_token');
      
      // Send the email through the API
      const response = await fetch('/api/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify(emailApiData),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      console.log('Email sent successfully:', result);
      
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
      
      // Reset success status after 5 seconds
      setTimeout(() => {
        setSendingStatus('idle');
      }, 5000);
      
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email: ' + error.message);
      setSendingStatus('error');
    }
  };
  
  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="bg-gray-800/70 shadow-xl rounded-xl overflow-hidden border border-gray-700 backdrop-blur-sm">
          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-6">
              {/* FROM FIELD */}
              <div className="group">
                <label htmlFor="from" className="block text-sm font-medium text-gray-300 mb-2">
                  From
                </label>
                <div className="relative rounded-lg transition-all duration-300 bg-gray-900/80 hover:bg-gray-900 focus-within:ring-2 focus-within:ring-primary-500 border border-gray-700 shadow-inner">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <div className="rounded-full h-7 w-7 flex items-center justify-center bg-primary-600/30 text-primary-400">
                      <span className="text-xs font-bold">LE</span>
                    </div>
                  </div>
                  <select
                    name="from"
                    id="from"
                    value={emailData.from}
                    onChange={handleInputChange}
                    className="block w-full pl-14 pr-4 py-3.5 text-base text-white bg-transparent border-0 focus:ring-0 focus:outline-none"
                    required
                  >
                    <option value="" disabled className="bg-gray-800 text-gray-300">Select an email address</option>
                    {userEmailAccounts.map(account => (
                      <option key={account.id} value={account.id} className="bg-gray-800 text-white">
                        {account.email} {account.isDefault ? '(Default)' : ''} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* TO FIELD */}
              <div className="group">
                <label htmlFor="to" className="block text-sm font-medium text-gray-300 mb-2">
                  To
                </label>
                <div className="relative rounded-lg transition-all duration-300 bg-gray-900/80 hover:bg-gray-900 focus-within:ring-2 focus-within:ring-primary-500 border border-gray-700 shadow-inner">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-primary-400" />
                  </div>
                  <input
                    type="email"
                    name="to"
                    id="to"
                    value={emailData.to}
                    onChange={handleInputChange}
                    className="block w-full pl-14 pr-20 py-3.5 text-base text-white bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-500"
                    placeholder="recipient@example.com"
                    required
                  />
                  
                  {/* Encryption status indicator */}
                  {emailData.to && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      {encryptionStatus === 'available' ? (
                        <div className="flex items-center rounded-full px-3 py-1 bg-green-900/30 border border-green-800">
                          <LockClosedIcon className="h-4 w-4 mr-1.5 text-green-400" />
                          <span className="text-xs font-medium text-green-400">Encrypted</span>
                        </div>
                      ) : encryptionStatus === 'unavailable' ? (
                        <div className="flex items-center rounded-full px-3 py-1 bg-yellow-900/30 border border-yellow-800">
                          <ShieldCheckIcon className="h-4 w-4 mr-1.5 text-yellow-400" />
                          <span className="text-xs font-medium text-yellow-400">Unencrypted</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                {encryptionStatus === 'unavailable' && (
                  <p className="mt-2 text-xs text-yellow-400 flex items-center">
                    <ShieldCheckIcon className="h-3.5 w-3.5 mr-1.5" />
                    No PGP key found for this recipient. The message will be sent with standard TLS encryption.
                  </p>
                )}
              </div>
              
              {/* SUBJECT FIELD */}
              <div className="group">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <div className="relative rounded-lg transition-all duration-300 bg-gray-900/80 hover:bg-gray-900 focus-within:ring-2 focus-within:ring-primary-500 border border-gray-700 shadow-inner">
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={emailData.subject}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3.5 text-base text-white bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-500"
                    placeholder="Email subject"
                    required
                  />
                </div>
              </div>
              
              {/* MESSAGE FIELD */}
              <div className="group">
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <div className="relative rounded-lg transition-all duration-300 bg-gray-900/80 hover:bg-gray-900 focus-within:ring-2 focus-within:ring-primary-500 border border-gray-700 shadow-inner">
                  <textarea
                    id="message"
                    name="message"
                    rows={14}
                    value={emailData.message}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-4 text-base text-white bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-500 resize-y"
                    placeholder="Write your message here..."
                    required
                  />
                </div>
              </div>
              
              {/* ATTACHMENTS */}
              <div>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2.5 border border-gray-600 rounded-lg text-sm font-medium text-white bg-gray-800/80 hover:bg-gray-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-500"
                  >
                    <PaperClipIcon className="h-5 w-5 mr-2 text-primary-400" aria-hidden="true" />
                    Attach File
                  </button>
                  <span className="text-sm text-gray-400">
                    {emailData.attachments.length > 0 
                      ? `${emailData.attachments.length} ${emailData.attachments.length === 1 ? 'file' : 'files'} attached` 
                      : 'No files attached'}
                  </span>
                  {userPublicKey && (
                    <div className="inline-flex items-center px-3 py-1.5 bg-primary-600/20 rounded-lg border border-primary-600/30">
                      <LockClosedIcon className="h-4 w-4 mr-1.5 text-primary-400" />
                      <span className="text-xs font-medium text-primary-400">Public key will be attached</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const newAttachments = files.map(file => ({
                        id: `file-${Math.random().toString(36).substring(7)}`,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        file // Keep the File object for later upload
                      }));
                      
                      setEmailData({
                        ...emailData,
                        attachments: [...emailData.attachments, ...newAttachments]
                      });
                      
                      // Reset the file input
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  />
                </div>
                
                {/* Attachment list */}
                {emailData.attachments.length > 0 && (
                  <div className="mt-4 bg-gray-900/70 rounded-lg border border-gray-700 p-3">
                    <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <PaperClipIcon className="h-4 w-4 mr-2 text-primary-400" />
                      Attachments
                    </h4>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
                      {emailData.attachments.map(attachment => (
                        <div 
                          key={attachment.id}
                          className="flex items-center justify-between p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3 truncate">
                            <div className="p-1.5 bg-primary-600/20 rounded-md">
                              <PaperClipIcon className="h-4 w-4 text-primary-400" />
                            </div>
                            <div className="truncate">
                              <p className="text-sm text-white truncate">{attachment.name}</p>
                              <p className="text-xs text-gray-400">{(attachment.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEmailData({
                                ...emailData,
                                attachments: emailData.attachments.filter(a => a.id !== attachment.id)
                              });
                            }}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* FOOTER / ACTIONS */}
            <div className="px-8 py-5 bg-gray-900/90 border-t border-gray-700 flex justify-between items-center">
              <div>
                {sendingStatus === 'success' && (
                  <div className="flex items-center text-green-400 bg-green-900/30 px-4 py-2 rounded-lg border border-green-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Message sent successfully!</span>
                  </div>
                )}
                {sendingStatus === 'error' && (
                  <div className="flex items-center text-red-400 bg-red-900/30 px-4 py-2 rounded-lg border border-red-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Error sending message. Please try again.</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to discard this message?')) {
                      setEmailData({
                        from: emailData.from, // Keep the from address
                        to: '',
                        subject: '',
                        message: '',
                        attachments: []
                      });
                      setEncryptionStatus('unknown');
                    }
                  }}
                  className="inline-flex items-center px-5 py-2.5 border border-gray-600 rounded-lg text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 transition-colors shadow-sm focus:outline-none"
                >
                  <XMarkIcon className="h-5 w-5 mr-2 text-gray-400" aria-hidden="true" />
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={sendingStatus === 'sending'}
                  className={`inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white shadow-sm focus:outline-none ${
                    sendingStatus === 'sending'
                      ? 'bg-primary-500/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 transition-all duration-300'
                  }`}
                >
                  {sendingStatus === 'sending' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5 mr-2 transform rotate-90" aria-hidden="true" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}