'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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
  FolderIcon,
  KeyIcon,
  CodeBracketIcon,
  PrinterIcon,
  FlagIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function EmailDetail({ message, onBack, onDelete, onReply, onForward }) {
  const [decrypted, setDecrypted] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
  
  const handleReply = () => {
    // Get the body content - prefer text, then strip HTML tags from html
    let bodyContent = message.text || message.body || '';
    if (!bodyContent && message.html) {
      // Strip HTML tags for quote
      bodyContent = message.html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    }

    // Prepare data for reply
    const replyData = {
      replyTo: message.from,
      subject: message.subject,
      date: message.timestamp || message.date,
      originalBody: bodyContent,
    };

    // Call the reply handler passed from parent
    if (onReply) {
      onReply(replyData);
    }
  };
  
  const handleForward = () => {
    // Get the body content - prefer text, then strip HTML tags from html
    let bodyContent = message.text || message.body || '';
    if (!bodyContent && message.html) {
      // Strip HTML tags for quote
      bodyContent = message.html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    }

    // Prepare data for forwarding
    const forwardData = {
      subject: message.subject,
      date: message.timestamp || message.date,
      from: message.from,
      to: message.to,
      originalBody: bodyContent,
      attachments: message.attachments || [],
    };

    // Call the forward handler passed from parent
    if (onForward) {
      onForward(forwardData);
    }
  };

  // Check if message is actually PGP encrypted (not just has encryptedBody flag)
  const isActuallyEncrypted = () => {
    // Check for explicit encryptedBody flag
    if (message.encryptedBody === true) return true;

    // Check message content for PGP markers
    const content = message.text || message.html || '';
    return content.includes('-----BEGIN PGP MESSAGE-----') ||
           content.includes('-----BEGIN PGP SIGNED MESSAGE-----');
  };

  // Handle clicking on email address - open compose instead of mailto
  const handleEmailClick = (e, email) => {
    e.preventDefault();
    // Navigate to compose with pre-filled recipient
    router.push(`/dashboard/compose?to=${encodeURIComponent(email)}`);
  };

  // Generate Gravatar URL from email using proper MD5 hash
  const getGravatarUrl = (email, size = 80) => {
    if (!email) return null;
    const normalizedEmail = email.trim().toLowerCase();

    // Simple MD5 implementation for Gravatar
    const md5 = (string) => {
      function rotateLeft(value, shift) {
        return (value << shift) | (value >>> (32 - shift));
      }
      function addUnsigned(x, y) {
        const x8 = x & 0x80000000;
        const y8 = y & 0x80000000;
        const x4 = x & 0x40000000;
        const y4 = y & 0x40000000;
        const result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
        if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
        if (x4 | y4) {
          if (result & 0x40000000) return result ^ 0xC0000000 ^ x8 ^ y8;
          return result ^ 0x40000000 ^ x8 ^ y8;
        }
        return result ^ x8 ^ y8;
      }
      function F(x, y, z) { return (x & y) | (~x & z); }
      function G(x, y, z) { return (x & z) | (y & ~z); }
      function H(x, y, z) { return x ^ y ^ z; }
      function I(x, y, z) { return y ^ (x | ~z); }
      function FF(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
      }
      function GG(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
      }
      function HH(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
      }
      function II(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
      }
      function convertToWordArray(string) {
        let messageLength = string.length;
        let numberOfWords = (((messageLength + 8) - ((messageLength + 8) % 64)) / 64 + 1) * 16;
        let wordArray = new Array(numberOfWords - 1);
        let bytePosition = 0;
        let byteCount = 0;
        while (byteCount < messageLength) {
          let wordCount = (byteCount - (byteCount % 4)) / 4;
          bytePosition = (byteCount % 4) * 8;
          wordArray[wordCount] = (wordArray[wordCount] | (string.charCodeAt(byteCount) << bytePosition));
          byteCount++;
        }
        let wordCount = (byteCount - (byteCount % 4)) / 4;
        bytePosition = (byteCount % 4) * 8;
        wordArray[wordCount] = wordArray[wordCount] | (0x80 << bytePosition);
        wordArray[numberOfWords - 2] = messageLength << 3;
        wordArray[numberOfWords - 1] = messageLength >>> 29;
        return wordArray;
      }
      function wordToHex(value) {
        let hex = '', temp = '';
        for (let count = 0; count <= 3; count++) {
          temp = ((value >>> (count * 8)) & 255).toString(16);
          hex += (temp.length === 1 ? '0' + temp : temp);
        }
        return hex;
      }

      const x = convertToWordArray(string);
      let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
      const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
      const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
      const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
      const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

      for (let k = 0; k < x.length; k += 16) {
        const AA = a, BB = b, CC = c, DD = d;
        a = FF(a, b, c, d, x[k+0], S11, 0xD76AA478); d = FF(d, a, b, c, x[k+1], S12, 0xE8C7B756);
        c = FF(c, d, a, b, x[k+2], S13, 0x242070DB); b = FF(b, c, d, a, x[k+3], S14, 0xC1BDCEEE);
        a = FF(a, b, c, d, x[k+4], S11, 0xF57C0FAF); d = FF(d, a, b, c, x[k+5], S12, 0x4787C62A);
        c = FF(c, d, a, b, x[k+6], S13, 0xA8304613); b = FF(b, c, d, a, x[k+7], S14, 0xFD469501);
        a = FF(a, b, c, d, x[k+8], S11, 0x698098D8); d = FF(d, a, b, c, x[k+9], S12, 0x8B44F7AF);
        c = FF(c, d, a, b, x[k+10], S13, 0xFFFF5BB1); b = FF(b, c, d, a, x[k+11], S14, 0x895CD7BE);
        a = FF(a, b, c, d, x[k+12], S11, 0x6B901122); d = FF(d, a, b, c, x[k+13], S12, 0xFD987193);
        c = FF(c, d, a, b, x[k+14], S13, 0xA679438E); b = FF(b, c, d, a, x[k+15], S14, 0x49B40821);
        a = GG(a, b, c, d, x[k+1], S21, 0xF61E2562); d = GG(d, a, b, c, x[k+6], S22, 0xC040B340);
        c = GG(c, d, a, b, x[k+11], S23, 0x265E5A51); b = GG(b, c, d, a, x[k+0], S24, 0xE9B6C7AA);
        a = GG(a, b, c, d, x[k+5], S21, 0xD62F105D); d = GG(d, a, b, c, x[k+10], S22, 0x2441453);
        c = GG(c, d, a, b, x[k+15], S23, 0xD8A1E681); b = GG(b, c, d, a, x[k+4], S24, 0xE7D3FBC8);
        a = GG(a, b, c, d, x[k+9], S21, 0x21E1CDE6); d = GG(d, a, b, c, x[k+14], S22, 0xC33707D6);
        c = GG(c, d, a, b, x[k+3], S23, 0xF4D50D87); b = GG(b, c, d, a, x[k+8], S24, 0x455A14ED);
        a = GG(a, b, c, d, x[k+13], S21, 0xA9E3E905); d = GG(d, a, b, c, x[k+2], S22, 0xFCEFA3F8);
        c = GG(c, d, a, b, x[k+7], S23, 0x676F02D9); b = GG(b, c, d, a, x[k+12], S24, 0x8D2A4C8A);
        a = HH(a, b, c, d, x[k+5], S31, 0xFFFA3942); d = HH(d, a, b, c, x[k+8], S32, 0x8771F681);
        c = HH(c, d, a, b, x[k+11], S33, 0x6D9D6122); b = HH(b, c, d, a, x[k+14], S34, 0xFDE5380C);
        a = HH(a, b, c, d, x[k+1], S31, 0xA4BEEA44); d = HH(d, a, b, c, x[k+4], S32, 0x4BDECFA9);
        c = HH(c, d, a, b, x[k+7], S33, 0xF6BB4B60); b = HH(b, c, d, a, x[k+10], S34, 0xBEBFBC70);
        a = HH(a, b, c, d, x[k+13], S31, 0x289B7EC6); d = HH(d, a, b, c, x[k+0], S32, 0xEAA127FA);
        c = HH(c, d, a, b, x[k+3], S33, 0xD4EF3085); b = HH(b, c, d, a, x[k+6], S34, 0x4881D05);
        a = HH(a, b, c, d, x[k+9], S31, 0xD9D4D039); d = HH(d, a, b, c, x[k+12], S32, 0xE6DB99E5);
        c = HH(c, d, a, b, x[k+15], S33, 0x1FA27CF8); b = HH(b, c, d, a, x[k+2], S34, 0xC4AC5665);
        a = II(a, b, c, d, x[k+0], S41, 0xF4292244); d = II(d, a, b, c, x[k+7], S42, 0x432AFF97);
        c = II(c, d, a, b, x[k+14], S43, 0xAB9423A7); b = II(b, c, d, a, x[k+5], S44, 0xFC93A039);
        a = II(a, b, c, d, x[k+12], S41, 0x655B59C3); d = II(d, a, b, c, x[k+3], S42, 0x8F0CCC92);
        c = II(c, d, a, b, x[k+10], S43, 0xFFEFF47D); b = II(b, c, d, a, x[k+1], S44, 0x85845DD1);
        a = II(a, b, c, d, x[k+8], S41, 0x6FA87E4F); d = II(d, a, b, c, x[k+15], S42, 0xFE2CE6E0);
        c = II(c, d, a, b, x[k+6], S43, 0xA3014314); b = II(b, c, d, a, x[k+13], S44, 0x4E0811A1);
        a = II(a, b, c, d, x[k+4], S41, 0xF7537E82); d = II(d, a, b, c, x[k+11], S42, 0xBD3AF235);
        c = II(c, d, a, b, x[k+2], S43, 0x2AD7D2BB); b = II(b, c, d, a, x[k+9], S44, 0xEB86D391);
        a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
      }
      return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
    };

    const hash = md5(normalizedEmail);
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
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
          
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="inline-flex items-center p-2 text-gray-400 hover:text-white transition-colors"
            >
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 border border-gray-700 z-50"
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowOriginal(!showOriginal);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <CodeBracketIcon className="h-4 w-4 mr-3" />
                      {showOriginal ? 'Show formatted' : 'Show original'}
                    </button>
                    <button
                      onClick={() => {
                        window.print();
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <PrinterIcon className="h-4 w-4 mr-3" />
                      Print
                    </button>
                    <button
                      onClick={() => {
                        toggleStar();
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <FlagIcon className="h-4 w-4 mr-3" />
                      {isStarred ? 'Remove star' : 'Add star'}
                    </button>
                    <div className="border-t border-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        // Mark as spam functionality
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <NoSymbolIcon className="h-4 w-4 mr-3" />
                      Report spam
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
            <div className="h-10 w-10 rounded-full bg-primary-600/30 mr-4 flex items-center justify-center text-base font-medium text-primary-400 uppercase overflow-hidden">
              {!avatarError ? (
                <img
                  src={getGravatarUrl(message.from.email, 80)}
                  alt={message.from.name}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                message.from.name?.charAt(0) || message.from.email?.charAt(0) || '?'
              )}
            </div>
            <div>
              <div className="flex items-center">
                <p className="text-base font-medium text-white">
                  {message.from.name}
                  {message.encryptedBody && (
                    <LockClosedIcon className="inline ml-1.5 h-4 w-4 text-primary-400" />
                  )}
                </p>
                <button
                  onClick={(e) => handleEmailClick(e, message.from.email)}
                  className="ml-2 text-xs text-gray-400 hover:text-primary-400"
                >
                  &lt;{message.from.email}&gt;
                </button>
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
          onClick={handleReply}
          className="inline-flex items-center px-3 py-1.5 border border-gray-700 rounded-md text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          <ArrowUturnLeftIcon className="h-4 w-4 mr-1.5" />
          Reply
        </button>
        
        <button
          type="button"
          onClick={handleForward}
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
        {/* Only show decrypt UI if message is actually PGP encrypted */}
        {isActuallyEncrypted() && !decrypted ? (
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
            {isActuallyEncrypted() && decrypted && (
              <div className="bg-green-900/20 text-green-300 text-sm p-3 rounded-md mb-6 flex items-center">
                <LockClosedIcon className="h-5 w-5 mr-2 text-green-400" />
                This message was decrypted with your private key
              </div>
            )}

            {/* Show original message view */}
            {showOriginal ? (
              <div className="bg-gray-900 rounded-md p-4 overflow-x-auto">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
                  {message.text || message.html || 'No raw content available'}
                </pre>
              </div>
            ) : (
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
            )}
            
            {/* Attachments */}
            {message.attachments?.length > 0 && (
              <div className="mt-8 border-t border-gray-700 pt-6">
                <div className="flex items-center text-base font-medium text-white mb-4">
                  <PaperClipIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Attachments ({message.attachments.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {message.attachments.map((attachment, index) => {
                    const isPgpKey = attachment.filename?.endsWith('.asc') || 
                                    attachment.contentType === 'application/pgp-keys';
                    
                    return (
                      <div 
                        key={index}
                        className={`flex items-center p-3 rounded-md border ${
                          isPgpKey 
                            ? 'border-green-700 bg-green-900/20 hover:bg-green-900/30 cursor-pointer' 
                            : 'border-gray-700 bg-dashboard/60 hover:bg-dashboard'
                        } group transition-colors`}
                        onClick={isPgpKey ? () => router.push('/dashboard/contacts') : undefined}
                      >
                        <div className={`mr-3 p-2 rounded-md ${
                          isPgpKey ? 'bg-green-600/20' : 'bg-primary-600/20'
                        }`}>
                          {isPgpKey ? (
                            <KeyIcon className="h-6 w-6 text-green-400" />
                          ) : (
                            <DocumentTextIcon className="h-6 w-6 text-primary-400" />
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isPgpKey ? 'text-green-300' : 'text-white'
                          }`}>
                            {isPgpKey ? 'PGP Public Key' : attachment.filename}
                          </p>
                          <p className={`text-xs ${
                            isPgpKey ? 'text-green-400' : 'text-gray-500'
                          }`}>
                            {isPgpKey 
                              ? `From: ${message.from.email}` 
                              : `${(attachment.size / 1000).toFixed(1)} KB`
                            }
                          </p>
                        </div>
                        {isPgpKey ? (
                          <span className="ml-2 text-xs text-green-400">
                            View Contact →
                          </span>
                        ) : (
                          <button 
                            type="button"
                            className="ml-2 inline-flex items-center p-1.5 rounded-md text-gray-400 hover:text-primary-400 transition-colors"
                          >
                            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}