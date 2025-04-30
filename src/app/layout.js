import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/useAuth';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export const metadata = {
  title: 'KeyKeeper.world - Secure Email Services',
  description: 'Privacy-focused mail service powered by OpenPGP encryption',
  keywords: ['email', 'privacy', 'security', 'pgp', 'encryption', 'openpgp'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}