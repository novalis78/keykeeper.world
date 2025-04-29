'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Bars3Icon,
  XMarkIcon,
  EnvelopeIcon,
  KeyIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  CogIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { LockClosedIcon } from '@heroicons/react/24/solid';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Inbox', href: '/dashboard', icon: EnvelopeIcon, current: true },
    { name: 'Addresses', href: '/dashboard/addresses', icon: KeyIcon, current: false },
    { name: 'Security', href: '/dashboard/security', icon: ShieldCheckIcon, current: false },
    { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon, current: false },
    { name: 'Settings', href: '/dashboard/settings', icon: CogIcon, current: false },
  ];

  return (
    <div className="min-h-screen bg-dashboard">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 bg-gray-900/80 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-0`}>
        <div className="flex justify-between items-center h-16 px-4 border-b border-gray-700">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <LockClosedIcon className="h-7 w-7 text-primary-500" />
            <span className="text-lg font-bold text-white">KeyKeeper</span>
          </Link>
          <button 
            type="button" 
            className="-mr-2 p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4">
          <Link
            href="/dashboard/addresses/new"
            className="flex items-center justify-center w-full p-2 mb-6 text-white bg-primary-600 hover:bg-primary-500 rounded-md transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            <span>New Address</span>
          </Link>
          
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  item.current
                    ? 'bg-primary-700/20 text-primary-400'
                    : 'text-gray-300 hover:bg-sidebar hover:text-primary-400'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${
                  item.current
                    ? 'text-primary-500'
                    : 'text-gray-400'
                }`} />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <Link
            href="/logout"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-primary-400 hover:bg-sidebar rounded-md"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
            Sign out
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col md:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-dashboard shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              type="button"
              className="p-2 -ml-2 rounded-md text-gray-400 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                  US
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-200">User@example.com</div>
                <div className="text-xs text-primary-400">Premium</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 text-gray-200">
          {children}
        </main>
      </div>
    </div>
  );
}