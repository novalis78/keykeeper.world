'use client';

import { useState, useEffect } from 'react';
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
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { getCurrentUserId } from '@/lib/auth/getCurrentUser';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('Loading...');
  const [userInitials, setUserInitials] = useState('');

  useEffect(() => {
    async function fetchUserEmail() {
      try {
        const userId = getCurrentUserId();
        if (!userId) {
          console.error('No user ID found');
          setUserEmail('User@example.com'); // Fallback
          setUserInitials('US');
          return;
        }

        // Fetch the user's email from the virtual_users table
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
          setUserEmail(data.email);
          
          // Set initials from the email username
          const username = data.email.split('@')[0];
          if (username) {
            // Get up to two characters for initials
            const initials = username.substring(0, 2).toUpperCase();
            setUserInitials(initials);
          } else {
            setUserInitials('US');
          }
        } else {
          // Fallback if no email found
          console.warn('No email found for user ID:', userId);
          setUserEmail('User@example.com');
          setUserInitials('US');
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
        setUserEmail('User@example.com'); // Fallback
        setUserInitials('US');
      }
    }

    fetchUserEmail();
  }, []);

  const navigation = [
    { name: 'Inbox', href: '/dashboard', icon: EnvelopeIcon, current: true },
    { name: 'Addresses', href: '/dashboard/addresses', icon: KeyIcon, current: false },
    { name: 'Analytics', href: '/dashboard/analytics', icon: ArrowPathIcon, current: false },
    { name: 'Security', href: '/dashboard/security', icon: ShieldCheckIcon, current: false },
    { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon, current: false },
    { name: 'Settings', href: '/dashboard/settings', icon: CogIcon, current: false },
  ];

  return (
    <div className="flex h-screen bg-dashboard overflow-hidden">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 bg-gray-900/80 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-0 flex-shrink-0`}>
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
            href="/dashboard/compose"
            className="flex items-center justify-center w-full p-2 mb-6 text-white bg-primary-600 hover:bg-primary-500 rounded-md transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5 mr-2 transform rotate-90" />
            <span>Compose</span>
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
      <div className="flex flex-col flex-1 overflow-auto">
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
                  {userInitials}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-200">{userEmail}</div>
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