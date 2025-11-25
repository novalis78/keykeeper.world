'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { LockClosedIcon, PaperClipIcon, StarIcon, KeyIcon } from '@heroicons/react/20/solid';
import { motion } from 'framer-motion';

export default function EmailRow({ message, onClick, isSelected, onStar }) {
  const [isHovered, setIsHovered] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Generate Gravatar URL from email using MD5 hash
  const getGravatarUrl = (email, size = 40) => {
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

  const handleStar = (e) => {
    e.stopPropagation();
    if (onStar) {
      onStar(message.id, !message.starred);
    }
  };

  const isStarred = message.starred || false;

  // Check if message has PGP key attachment
  const hasPgpKey = message.attachments?.some(att => 
    att.filename?.endsWith('.asc') || 
    att.contentType === 'application/pgp-keys'
  );

  return (
    <motion.div 
      className={`
        ${message.read ? 'bg-sidebar' : 'bg-sidebar/80 dark:bg-primary-900/10'}
        ${isSelected ? 'bg-primary-700/20 border-l-4 border-primary-500' : 'border-l-4 border-transparent'}
        flex items-center py-3 px-4 cursor-pointer border-b border-gray-700 
        hover:bg-primary-900/20 transition-colors relative
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.005 }}
    >
      {/* Star icon */}
      <div className="mr-3 flex-shrink-0">
        <button 
          onClick={handleStar}
          className="focus:outline-none"
        >
          <StarIcon 
            className={`h-5 w-5 ${isStarred ? 'text-yellow-400' : 'text-gray-500'} 
              ${isHovered && !isStarred ? 'opacity-60' : 'opacity-100'}`} 
          />
        </button>
      </div>

      {/* Sender photo */}
      <div className="mr-4 flex-shrink-0 hidden sm:block">
        <div className="h-9 w-9 rounded-full bg-primary-600/30 flex items-center justify-center text-sm font-medium text-primary-400 uppercase overflow-hidden">
          {!avatarError ? (
            <img
              src={getGravatarUrl(message.from?.email, 72)}
              alt={message.from?.name || ''}
              className="h-full w-full object-cover"
              onError={() => setAvatarError(true)}
            />
          ) : (
            message.from?.name?.charAt(0) || message.from?.email?.charAt(0) || '?'
          )}
        </div>
      </div>
      
      {/* Sender and subject */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <p className={`text-sm font-medium truncate mr-2 ${message.read ? 'text-gray-200' : 'text-white font-semibold'}`}>
            {message.from?.name || message.from?.email || 'Unknown'}
          </p>
          
          {/* Email tags and PGP key indicator */}
          <div className="ml-auto sm:ml-2 flex space-x-1">
            {hasPgpKey && (
              <span className="inline-flex items-center rounded-full bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-300">
                <KeyIcon className="h-3 w-3 mr-1" />
                PGP Key
              </span>
            )}
            {message.labels?.map(label => (
              <span 
                key={label} 
                className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium 
                ${label === 'important' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                  label === 'alert' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                  'bg-primary-100 dark:bg-primary-800/40 text-primary-800 dark:text-primary-300'}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-baseline">
          <p className={`text-sm ${message.read ? 'text-gray-400' : 'text-gray-300'} mr-1`}>
            {message.subject}
          </p>
          
          <p className="text-xs truncate text-gray-500">
            - {message.snippet}
          </p>
        </div>
      </div>
      
      {/* Indicators and time */}
      <div className="ml-4 flex-shrink-0 flex flex-col items-end space-y-1">
        <div className="flex items-center">
          <span className={`text-xs ${message.read ? 'text-gray-500' : 'text-primary-400'}`}>
            {formattedDate(message.timestamp)}
          </span>
          
          <div className="flex ml-2">
            {message.encryptedBody && (
              <LockClosedIcon className="h-4 w-4 text-primary-500" />
            )}
            
            {message.attachments?.length > 0 && (
              <PaperClipIcon className="ml-1 h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
        
        <span className="text-xs text-gray-500">
          via {message.to.email.split('@')[0]}
        </span>
      </div>
    </motion.div>
  );
}