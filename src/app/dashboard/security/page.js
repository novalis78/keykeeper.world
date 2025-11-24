'use client';

import { useState } from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import Link from 'next/link';
import { 
  ShieldCheckIcon, 
  KeyIcon, 
  ServerIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function Security() {
  const [masterKeyDetails, setMasterKeyDetails] = useState({
    fingerprint: 'D4C3 A234 B56F 79E0 D123 C567 8901 2345 6789 ABCD',
    created: '2025-03-15',
    type: 'RSA-4096',
    expires: '2027-03-15',
    backupStatus: 'enabled'
  });

  return (
    <DashboardLayout>
      <div>
        {/* Master Key Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <KeyIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Master PGP Key
              </h3>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Your master key is used to encrypt and sign all communications
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Key Fingerprint</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono break-all">
                  {masterKeyDetails.fingerprint}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Key Type</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {masterKeyDetails.type}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {masterKeyDetails.created}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Expires</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {masterKeyDetails.expires}
                </dd>
              </div>
            </dl>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button 
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download Public Key
              </button>
              
              <button 
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                View Key Details
              </button>
              
              <button 
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
              >
                Generate New Key
              </button>
            </div>
          </div>
        </div>
        
        {/* Key Backup Status */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <ServerIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Key Backup
              </h3>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Securely encrypted backup of your master key
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className={`rounded-md p-4 ${
              masterKeyDetails.backupStatus === 'enabled' 
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-yellow-50 dark:bg-yellow-900/20'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {masterKeyDetails.backupStatus === 'enabled' ? (
                    <ShieldCheckIcon className="h-5 w-5 text-green-400 dark:text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 dark:text-yellow-500" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    masterKeyDetails.backupStatus === 'enabled'
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {masterKeyDetails.backupStatus === 'enabled'
                      ? 'Backup Enabled'
                      : 'Backup Not Configured'
                    }
                  </h3>
                  <div className={`mt-2 text-sm ${
                    masterKeyDetails.backupStatus === 'enabled'
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    <p>
                      {masterKeyDetails.backupStatus === 'enabled'
                        ? 'Your master key is securely backed up with end-to-end encryption. Only you can access it with your recovery passphrase.'
                        : 'Backing up your key is important for recovery. Your key will be encrypted with a recovery passphrase that only you know.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              {masterKeyDetails.backupStatus === 'enabled' ? (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                >
                  Update Backup Settings
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
                >
                  Enable Key Backup
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Security Features */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Security Features
              </h3>
            </div>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              <li className="py-4 flex justify-between items-center">
                <div className="flex items-center">
                  <LockClosedIcon className="h-5 w-5 mr-3 text-primary-600 dark:text-primary-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">End-to-End Encryption</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">All emails are encrypted with your PGP key</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                  Enabled
                </span>
              </li>
              
              <li className="py-4 flex justify-between items-center">
                <div className="flex items-center">
                  <KeyIcon className="h-5 w-5 mr-3 text-primary-600 dark:text-primary-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security with TOTP</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/security/2fa"
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                >
                  Manage 2FA
                </Link>
              </li>
              
              <li className="py-4 flex justify-between items-center">
                <div className="flex items-center">
                  <ServerIcon className="h-5 w-5 mr-3 text-primary-600 dark:text-primary-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Message Auto-Expiry</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automatically delete messages after a certain period</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="mr-3 text-sm text-gray-500 dark:text-gray-400">30 days</span>
                  <button
                    type="button"
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                  >
                    Change
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}