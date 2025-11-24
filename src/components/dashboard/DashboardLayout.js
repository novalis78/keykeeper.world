'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bars3Icon,
  XMarkIcon,
  EnvelopeIcon,
  KeyIcon,
  ShieldCheckIcon,
  CogIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/useAuth';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  const [userEmail, setUserEmail] = useState('Loading...');
  const [userInitials, setUserInitials] = useState('');

  useEffect(() => {
    if (loading) return;

    if (user && user.email) {
      setUserEmail(user.email);

      // Set initials from the email username
      const username = user.email.split('@')[0];
      if (username) {
        // Get up to two characters for initials
        const initials = username.substring(0, 2).toUpperCase();
        setUserInitials(initials);
      } else {
        setUserInitials('US');
      }
    } else {
      // No user logged in - try localStorage as fallback
      const storedEmail = localStorage.getItem('user_email');
      if (storedEmail) {
        setUserEmail(storedEmail);
        const username = storedEmail.split('@')[0];
        const initials = username.substring(0, 2).toUpperCase();
        setUserInitials(initials);
      } else {
        setUserEmail('User@example.com');
        setUserInitials('US');
      }
    }
  }, [user, loading]);

  const navigation = [
    { name: 'Inbox', href: '/dashboard', icon: EnvelopeIcon, current: true },
    { name: 'Sent', href: '/dashboard/sent', icon: PaperAirplaneIcon, current: false },
    { name: 'Contacts', href: '/dashboard/contacts', icon: UsersIcon, current: false },
    { name: 'Addresses', href: '/dashboard/addresses', icon: KeyIcon, current: false },
    { name: 'Analytics', href: '/dashboard/analytics', icon: ArrowPathIcon, current: false },
    { name: 'Security', href: '/dashboard/security', icon: ShieldCheckIcon, current: false },
    { name: 'Settings', href: '/dashboard/settings', icon: CogIcon, current: false },
  ];

  return (
    <div className="flex h-screen bg-dashboard overflow-hidden">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 bg-gray-900/80 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-0 flex-shrink-0`}>
        <div className="flex justify-between items-center h-16 px-4 border-b border-gray-700">
          <Link href="/dashboard" className="flex items-center space-x-2 group">
            <div className="relative">
              <img
                src="/logo-small.png"
                alt="KeyKeeper"
                className="h-8 w-8 object-contain transition-all duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-teal-400/0 group-hover:bg-teal-400/30 rounded-lg blur-xl transition-all duration-300 -z-10"></div>
            </div>
            <span className="text-lg font-bold text-white group-hover:text-primary-300 transition-colors">KeyKeeper</span>
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