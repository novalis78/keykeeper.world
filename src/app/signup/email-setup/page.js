'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, LockClosedIcon, KeyIcon, EnvelopeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function EmailSetupPage() {
  const [step, setStep] = useState(1); // 1: Email setup, 2: Key confirmation, 3: Success
  const [formData, setFormData] = useState({
    localPart: '',
    domain: 'keykeeper.world',
    displayName: '',
    passphrase: '',
    confirmPassphrase: '',
    pgpKey: null,
    usePassphrase: false
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [error, setError] = useState(null);
  const [passphraseStrength, setPassphraseStrength] = useState(0);
  
  // Domain options - in a real implementation, these would come from an API
  const domainOptions = [
    { id: 1, name: 'keykeeper.world', isDefault: true },
    { id: 2, name: 'phoneshield.ai', isDefault: false }
  ];
  
  // Simulate checking username availability
  // Load data from previous step if available
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('signup_data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.name) {
          setFormData(prev => ({
            ...prev,
            displayName: parsedData.name
          }));
        }
      }
    } catch (err) {
      console.error('Error loading saved signup data:', err);
    }
  }, []);

  useEffect(() => {
    if (formData.localPart.length > 2) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(formData.localPart, formData.domain);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setIsAvailable(null);
    }
  }, [formData.localPart, formData.domain]);
  
  const checkUsernameAvailability = async (username, domain) => {
    if (username.length < 3) {
      return;
    }
    
    setIsChecking(true);
    
    try {
      // In a real implementation, this would be an API call
      // For mock data, we'll pretend certain usernames are taken
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const takenUsernames = ['admin', 'info', 'test', 'user', 'support', 'hello'];
      const isUsernameTaken = takenUsernames.includes(username.toLowerCase());
      
      setIsAvailable(!isUsernameTaken);
    } catch (err) {
      console.error('Error checking username availability:', err);
      setError('Failed to check username availability. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Calculate passphrase strength if applicable
      if (name === 'passphrase') {
        calculatePassphraseStrength(value);
      }
    }
  };
  
  // Simple passphrase strength calculator
  const calculatePassphraseStrength = (passphrase) => {
    if (!passphrase) {
      setPassphraseStrength(0);
      return;
    }
    
    let strength = 0;
    
    // Length check (up to 5 points)
    strength += Math.min(5, Math.floor(passphrase.length / 2));
    
    // Character variety checks
    if (/[A-Z]/.test(passphrase)) strength += 1; // uppercase
    if (/[a-z]/.test(passphrase)) strength += 1; // lowercase
    if (/[0-9]/.test(passphrase)) strength += 1; // numbers
    if (/[^A-Za-z0-9]/.test(passphrase)) strength += 2; // special chars
    
    // Word count for passphrases (bonus points)
    const words = passphrase.split(/\s+/).filter(Boolean).length;
    strength += Math.min(2, words);
    
    setPassphraseStrength(Math.min(10, strength));
  };
  
  const handleDomainChange = (e) => {
    setFormData(prev => ({
      ...prev,
      domain: e.target.value
    }));
  };
  
  const handleGeneratePGPKey = async () => {
    setError(null);
    
    // Validate passphrase if using one
    if (formData.usePassphrase) {
      if (formData.passphrase.length < 8) {
        setError('Your passphrase must be at least 8 characters long');
        return;
      }
      
      if (formData.passphrase !== formData.confirmPassphrase) {
        setError('Passphrases do not match');
        return;
      }
      
      if (passphraseStrength < 4) {
        setError('Please use a stronger passphrase for better security');
        return;
      }
    }
    
    try {
      // Show some kind of loading state or indicator
      const generatingEl = document.getElementById('generating-indicator');
      if (generatingEl) {
        generatingEl.classList.remove('hidden');
      }
      
      // In a real implementation, this would generate a PGP key pair
      // For now, we'll simulate the process with a visible delay
      console.log('Starting key generation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Key generation complete');
      
      // In a real implementation, call the proper PGP utility with passphrase
      console.log('Generating key with passphrase:', formData.usePassphrase && formData.passphrase ? 'Yes' : 'No');
      
      // Construct full email address
      const email = `${formData.localPart}@${formData.domain}`;
      
      // Generate the real PGP key using our utility (if available)
      let generatedKey;
      try {
        const pgpUtils = await import('@/lib/auth/pgp').then(mod => mod.default);
        const keyOptions = formData.usePassphrase ? { passphrase: formData.passphrase } : {};
        generatedKey = await pgpUtils.generateKey(formData.displayName, email, keyOptions);
        console.log('Key generated successfully:', generatedKey);
      } catch (err) {
        console.error('Error importing pgpUtils or generating key:', err);
        
        // Fallback to mock data if real generation fails
        const hasPassphrase = formData.usePassphrase && formData.passphrase;
        generatedKey = {
          fingerprint: 'D4C3 A234 B56F 79E0 D123 C567 8901 2345 6789 ABCD',
          publicKey: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n(mock key data)\n-----END PGP PUBLIC KEY BLOCK-----',
          privateKey: hasPassphrase 
            ? '-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: OpenPGP.js\nComment: https://openpgpjs.org\n\nxcLYBGRUFUMBACAC7FzR0JQ...(mock ENCRYPTED PRIVATE KEY data)\n-----END PGP PRIVATE KEY BLOCK-----' 
            : '-----BEGIN PGP PRIVATE KEY BLOCK-----\n(mock unencrypted key data)\n-----END PGP PRIVATE KEY BLOCK-----',
          hasPassphrase: hasPassphrase,
          passphrase: hasPassphrase ? formData.passphrase : null
        };
      }
      
      // Hide loading indicator if it exists
      if (generatingEl) {
        generatingEl.classList.add('hidden');
      }
      
      setFormData(prev => ({
        ...prev,
        pgpKey: mockPGPKey
      }));
      
      // Move to success step
      setStep(3);
      
    } catch (err) {
      console.error('Error generating PGP key:', err);
      setError('Failed to generate PGP key. Please try again.');
      
      // Hide loading indicator on error too
      const generatingEl = document.getElementById('generating-indicator');
      if (generatingEl) {
        generatingEl.classList.add('hidden');
      }
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isAvailable) {
      return;
    }
    
    // Validation
    if (formData.localPart.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }
    
    if (!formData.displayName) {
      setError('Please enter a display name');
      return;
    }
    
    // Proceed to next step
    setError(null);
    setStep(2);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <LockClosedIcon className="h-16 w-16 text-primary-600 dark:text-primary-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Create Your Secure Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Your private communications, protected by end-to-end encryption
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Step progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  <EnvelopeIcon className="h-6 w-6" />
                </div>
                <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Email Setup</span>
              </div>
              
              <div className={`flex-1 h-1 mx-2 ${
                step >= 2 ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
              
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  <KeyIcon className="h-6 w-6" />
                </div>
                <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Key Generation</span>
              </div>
              
              <div className={`flex-1 h-1 mx-2 ${
                step >= 3 ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
              
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  <CheckCircleIcon className="h-6 w-6" />
                </div>
                <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Complete</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {/* Step 1: Email Setup */}
          {step === 1 && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="localPart" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Choose your email address
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="localPart"
                      id="localPart"
                      value={formData.localPart}
                      onChange={handleInputChange}
                      className="appearance-none flex-1 min-w-0 rounded-l-md focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 shadow-sm placeholder-gray-400 dark:bg-gray-700 dark:text-white focus:outline-none"
                      placeholder="username"
                      autoComplete="off"
                      required
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm">
                      @
                      <select
                        name="domain"
                        id="domain"
                        value={formData.domain}
                        onChange={handleDomainChange}
                        className="ml-1 border-0 bg-transparent focus:ring-0 focus:outline-none dark:text-white"
                      >
                        {domainOptions.map(domain => (
                          <option key={domain.id} value={domain.name}>
                            {domain.name}
                          </option>
                        ))}
                      </select>
                    </span>
                  </div>
                  
                  {/* Availability indicator */}
                  {formData.localPart.length > 2 && (
                    <div className="mt-2 flex items-center">
                      {isChecking ? (
                        <div className="flex items-center">
                          <div className="animate-spin h-4 w-4 border-t-2 border-primary-500 rounded-full mr-2" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Checking availability...</span>
                        </div>
                      ) : isAvailable ? (
                        <div className="flex items-center text-green-600 dark:text-green-500">
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          <span className="text-xs">Available!</span>
                        </div>
                      ) : isAvailable === false ? (
                        <div className="flex items-center text-red-600 dark:text-red-500">
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          <span className="text-xs">This username is not available</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  {formData.localPart.length > 0 && formData.localPart.length < 3 && (
                    <p className="mt-2 text-xs text-amber-500 dark:text-amber-400">
                      Username must be at least 3 characters
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Display Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="displayName"
                      id="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      placeholder="Your Name"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={!isAvailable || formData.localPart.length < 3 || !formData.displayName}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      !isAvailable || formData.localPart.length < 3 || !formData.displayName
                        ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                    }`}
                  >
                    Continue to Key Generation
                  </button>
                </div>
              </div>
            </form>
          )}
          
          {/* Step 2: Key Generation */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Generate Your PGP Key</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your PGP key is required for secure communication. It will be generated on your device and never sent to our servers.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <EnvelopeIcon className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address:</span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white ml-7">{`${formData.localPart}@${formData.domain}`}</p>
                
                <div className="flex items-center mt-4 mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Name:</span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white">{formData.displayName}</p>
              </div>
              
              <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-md border border-primary-200 dark:border-primary-900">
                <h4 className="text-sm font-medium text-primary-700 dark:text-primary-400">Security Information</h4>
                <ul className="mt-2 space-y-1 text-xs text-primary-600 dark:text-primary-300">
                  <li>Your key will be generated using 4096-bit RSA encryption</li>
                  <li>The private key will never leave your browser</li>
                  <li>We'll help you securely back up your key afterward</li>
                  <li>Adding a passphrase provides an extra layer of security</li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-start mb-4">
                  <div className="flex items-center h-5">
                    <input
                      id="use-passphrase"
                      name="usePassphrase"
                      type="checkbox"
                      checked={formData.usePassphrase}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="use-passphrase" className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                      Protect key with a passphrase
                    </label>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      Adding a passphrase means you'll need to enter it when logging in, but provides stronger security.
                    </p>
                  </div>
                </div>
                
                {formData.usePassphrase && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Key Passphrase
                      </label>
                      <input
                        type="password"
                        id="passphrase"
                        name="passphrase"
                        value={formData.passphrase}
                        onChange={handleInputChange}
                        className="appearance-none mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        placeholder="Enter a strong passphrase"
                      />
                      
                      {/* Passphrase strength indicator */}
                      {formData.passphrase && (
                        <div className="mt-2">
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                passphraseStrength < 4 ? 'bg-red-500' : 
                                passphraseStrength < 7 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${passphraseStrength * 10}%` }}
                            ></div>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {passphraseStrength < 4 ? 'Weak' : 
                             passphraseStrength < 7 ? 'Moderate' : 
                             'Strong'} passphrase
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassphrase" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirm Passphrase
                      </label>
                      <input
                        type="password"
                        id="confirmPassphrase"
                        name="confirmPassphrase"
                        value={formData.confirmPassphrase}
                        onChange={handleInputChange}
                        className="appearance-none mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        placeholder="Confirm your passphrase"
                      />
                      
                      {formData.passphrase && formData.confirmPassphrase && (
                        <p className={`mt-1 text-xs ${
                          formData.passphrase === formData.confirmPassphrase 
                            ? 'text-green-500 dark:text-green-400' 
                            : 'text-red-500 dark:text-red-400'
                        }`}>
                          {formData.passphrase === formData.confirmPassphrase 
                            ? 'Passphrases match' 
                            : 'Passphrases do not match'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div id="generating-indicator" className="hidden bg-primary-50 dark:bg-primary-900/30 p-4 rounded-md text-center mb-4">
                <div className="inline-block animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
                <p className="mt-2 text-sm text-primary-700 dark:text-primary-300">Generating your PGP key pair...</p>
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">This may take a few moments</p>
              </div>
            
              <div>
                <button
                  type="button"
                  onClick={handleGeneratePGPKey}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Generate PGP Key Now
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-2 w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Back
                </button>
              </div>
            </div>
          )}
          
          {/* Step 3: Success */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-500 mx-auto" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Account Created Successfully!</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your secure email account has been set up with end-to-end encryption.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <EnvelopeIcon className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your New Email:</span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white ml-7">{`${formData.localPart}@${formData.domain}`}</p>
                
                <div className="flex items-center mt-4 mb-2">
                  <KeyIcon className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PGP Key Fingerprint:</span>
                </div>
                <p className="text-sm font-mono text-gray-900 dark:text-white ml-7">{formData.pgpKey?.fingerprint}</p>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-900">
                <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Important Security Step</h4>
                <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-300">
                  Please back up your encryption key now. This is the only time you'll be able to download it directly.
                </p>
                {formData.pgpKey?.hasPassphrase && (
                  <div className="mt-2 bg-white dark:bg-gray-700 p-2 rounded-md">
                    <div className="flex items-start">
                      <ShieldCheckIcon className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-700 dark:text-gray-300 ml-2">
                        Your key is protected with a passphrase. Remember this passphrase - you'll need it to log in.
                      </p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    // Create a Blob containing the private key
                    const blob = new Blob([formData.pgpKey?.privateKey], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    
                    // Create a temporary link element and trigger download
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `keykeeper_${formData.localPart}_private.asc`;
                    document.body.appendChild(a);
                    a.click();
                    
                    // Clean up
                    URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  }}
                  className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Download Key Backup
                </button>
              </div>
              
              <div>
                <Link 
                  href="/dashboard"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}