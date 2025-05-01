'use client';

import { useState } from 'react';
import { ArrowRightIcon, LockClosedIcon, CheckIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';
import TieredAuthOptions from '@/components/auth/TieredAuthOptions';
import pgpUtils from '@/lib/auth/pgp';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    authOption: null,
    agreedToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [keyGenerated, setKeyGenerated] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleAuthOptionSelect = (option) => {
    setFormData({
      ...formData,
      authOption: option
    });
  };
  
  const handleGenerateKey = async () => {
    if (!formData.email || !formData.name) return;
    
    setLoading(true);
    try {
      // Generate key using the pgpUtils library
      const key = await pgpUtils.generateKey(formData.name, formData.email);
      setGeneratedKey(key);
      setKeyGenerated(true);
    } catch (error) {
      console.error('Error generating key:', error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadKey = () => {
    if (!generatedKey) return;
    
    // Create a Blob containing the private key
    const blob = new Blob([generatedKey.privateKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `keykeeper_${formData.email.split('@')[0]}_private.asc`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      setStep(2);
      return;
    }
    
    if (step === 2) {
      // Redirect to email-setup flow with current data
      localStorage.setItem('signup_data', JSON.stringify({
        email: formData.email,
        name: formData.displayName || formData.name,
        authOption: formData.authOption
      }));
      window.location.href = '/signup/email-setup';
      return;
    }
    
    if (step === 3 && !keyGenerated) {
      await handleGenerateKey();
      return;
    }
    
    if (step === 3 && keyGenerated) {
      setLoading(true);
      
      try {
        // Submit registration to the API
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name || '',
            publicKey: generatedKey.publicKey,
            keyId: generatedKey.keyId,
            fingerprint: generatedKey.fingerprint,
            authMethod: formData.authOption === 'browser-key' ? 'browser' : 
                      formData.authOption === 'password-manager' ? 'password_manager' : 'hardware_key'
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to register');
        }
        
        console.log('Registration successful:', data);
        
        // Store the user ID and email in localStorage for session management
        // (in a real app, you'd use a proper auth system)
        if (data.userId) {
          try {
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userEmail', formData.email);
            console.log('User session data saved:', { userId: data.userId, email: formData.email });
          } catch (err) {
            console.error('Error saving user session data:', err);
          }
        }
        
        // Navigate to success step
        setStep(4);
      } catch (error) {
        console.error('Registration error:', error);
        alert(`Registration failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const renderBackupInstructions = () => {
    switch (formData.authOption) {
      case 'browser-key':
        return (
          <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">Important: Download your private key and store it in a safe place.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Save this file somewhere secure on your device</li>
              <li>Consider encrypting it with a password manager</li>
              <li>You'll need this key to sign in to your account</li>
              <li>If you lose this key, you won't be able to access your account</li>
            </ul>
          </div>
        );
        
      case 'password-manager':
        return (
          <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">Save your key in your password manager:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Download your private key file</li>
              <li>Open your password manager (Bitwarden, 1Password, etc.)</li>
              <li>Create a new secure note for KeyKeeper.world</li>
              <li>Copy the entire contents of the private key file</li>
              <li>Paste it into the secure note and save</li>
            </ol>
          </div>
        );
        
      case 'hardware-key':
        return (
          <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">Connect your hardware security key:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Connect your YubiKey or other security key to your device</li>
              <li>Download a backup of your private key for safekeeping</li>
              <li>Follow the prompts to associate the key with your account</li>
              <li>You'll need this hardware key to sign in to your account</li>
              <li>Keep your downloaded backup key in a secure location</li>
            </ol>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Your Account</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Your Existing Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="pl-10 block w-full rounded-lg border-0 py-3.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-primary-400 transition-all duration-200 bg-white dark:bg-gray-800 dark:bg-opacity-80"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-lg border-0 py-3.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-primary-400 transition-all duration-200 bg-white dark:bg-gray-800 dark:bg-opacity-80"
                    placeholder="John Doe"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Your name will be included in your PGP key for identification purposes.
                </p>
              </div>
              
              <div className="flex items-center pt-3">
                <input
                  id="terms"
                  name="agreedToTerms"
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={handleInputChange}
                  required
                  className="h-5 w-5 text-primary-500 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 border-gray-300 dark:border-gray-600 rounded transition-all duration-200"
                />
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-medium text-gray-700 dark:text-gray-200">
                    I agree to the <span className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 cursor-pointer underline underline-offset-2">Terms of Service</span> and <span className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 cursor-pointer underline underline-offset-2">Privacy Policy</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return <TieredAuthOptions onOptionSelect={handleAuthOptionSelect} />;
        
      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {keyGenerated ? 'Secure Your Key' : 'Generate Your PGP Key'}
            </h2>
            
            {!keyGenerated ? (
              <div className="text-center">
                <div className="mb-6 text-gray-600 dark:text-gray-400">
                  We'll generate a secure PGP key pair for you. Your public key will be stored on our server,
                  while the private key will remain only with you.
                </div>
                
                <div className="animate-pulse inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 mb-4">
                  <LockClosedIcon className="h-12 w-12" />
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  Click the button below to generate your key pair.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-green-100 dark:bg-green-900 rounded-full p-2">
                    <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                
                <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                  Your PGP key has been generated successfully!
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                  <div className="text-sm font-mono overflow-hidden text-ellipsis">
                    <div className="mb-2">
                      <span className="text-gray-500 dark:text-gray-400">Key ID:</span>{' '}
                      <span className="text-gray-900 dark:text-gray-100">{generatedKey?.keyId}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Fingerprint:</span>{' '}
                      <span className="text-gray-900 dark:text-gray-100">{generatedKey?.fingerprint}</span>
                    </div>
                  </div>
                </div>
                
                {renderBackupInstructions()}
                
                <button
                  type="button"
                  onClick={handleDownloadKey}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 mb-4"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Download Private Key
                </button>
                
                <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                  This is the only time you'll be able to download your key.
                  Make sure to keep it in a safe place.
                </div>
              </div>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-3">
                <CheckIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Account Created Successfully!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your secure KeyKeeper account has been created. You're now ready to experience
              email with enhanced privacy and security.
            </p>
            
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
            >
              Go to Dashboard
            </Link>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <Link href="/" className="flex justify-center">
          <span className="sr-only">KeyKeeper</span>
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all duration-300">
            <LockClosedIcon className="h-9 w-9 text-white" />
          </div>
        </Link>
        <h1 className="mt-6 text-center text-4xl font-extrabold text-white">
          KeyKeeper<span className="text-primary-400">.world</span>
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl">
        <div className="bg-white dark:bg-gray-800 py-10 px-6 shadow-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 sm:px-12 backdrop-blur-lg bg-opacity-95 dark:bg-opacity-90">
          <form onSubmit={handleSubmit}>
            {/* Step indicator */}
            <div className="mb-6">
              <ol className="flex items-center">
                {[1, 2, 3, 4].map((stepNumber) => (
                  <li key={stepNumber} className="relative flex-1">
                    <div className="flex items-center">
                      <div
                        className={`h-2 w-full ${
                          stepNumber <= step ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      ></div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            
            {renderStepContent()}
            
            <div className="mt-6 flex justify-between">
              {step > 1 && step < 4 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Back
                </button>
              )}
              
              {step < 4 && (
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`${step > 1 ? 'ml-auto' : 'w-full'} inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white ${
                    loading 
                      ? 'bg-primary-400 dark:bg-primary-800' 
                      : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 dark:from-primary-600 dark:to-primary-500 dark:hover:from-primary-500 dark:hover:to-primary-400'
                  } transition-all duration-300`}
                  disabled={loading || (step === 1 && (!formData.email || !formData.agreedToTerms)) || (step === 2 && !formData.authOption)}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : step === 3 && !keyGenerated ? (
                    <>Generate My Key</>
                  ) : (
                    <>
                      {step === 3 ? 'Complete Signup' : 'Continue'}
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}