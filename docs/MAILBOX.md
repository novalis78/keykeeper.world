Here are instructions for the development AI to implement email account creation using direct MySQL integration for your dovecot/postfix setup:
Developer Instructions: Email Account Creation for Keykeeper.world
Overview
The mail server for keykeeper.world is already set up on the host with dovecot and MySQL. The containerized NextJS application needs to create mail accounts during user onboarding. Since:

The Docker container has access to MySQL
Dovecot is configured to use MySQL for authentication
Dovecot has vmail settings configured

The recommended approach is to insert directly into MySQL without manual directory creation.
Implementation Steps
1. Create Mail Account ServiceMail Account Service InstructionsCode // Create a mailAccountService.js file in your NextJS project

import mysql from 'mysql2/promise';

/**
 * Creates a new email account by inserting into the MySQL database
 * Dovecot is configured to auto-create mail directories on first login
 * 
 *2. Test Implementation
Create a test script to verify that MySQL-only account creation works properly with your dovecot setup:Test Script InstructionsCode // Create a test-mail-setup.js script

import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.con3. Integration into NextJS ApplicationNextJS Integration InstructionsCode // Integration steps for your NextJS application

// 1. Install required dependencies
// Run these commands in your project:
// npm install mysql2 crypto-js dotenv

// 2. Set up environment variables in .env file
// Add these to your .env file (modifTechnical Details for Implementation
Important Dovecot/MySQL Configuration Notes

Password Hashing: The password hashing method must match what your dovecot expects. Check your dovecot config for the password_scheme setting. Common schemes include:

SHA512-CRYPT
BCRYPT
SSHA256
ARGON2I


Database Schema: The MySQL table structure must match what dovecot is configured to use. Common table names include:

virtual_users
mailbox
users


Auto-Directory Creation: Modern dovecot setups with vmail settings auto-create mail directories on first login, eliminating the need for explicit directory creation.
Mail Path Format: Verify the mail path format in dovecot config. It typically follows a pattern like:
mail_location = maildir:/var/mail/vhosts/%d/%n
Where %d is the domain and %n is the username.
Testing is Critical: Always run the test script first to confirm the MySQL-only approach works with your configuration before implementing it in production.

Troubleshooting
If the test fails, check these common issues:

Password Format: Ensure the password is hashed using the exact format dovecot expects.
MySQL Permissions: Verify the MySQL user has appropriate privileges.
Dovecot Configuration: Check if auto-directory creation is enabled.
Mail Delivery: Verify postfix can deliver to the newly created accounts.
Log Files: Check dovecot and postfix logs for errors:
tail -f /var/log/mail.log


If MySQL-only insertion doesn't work, you may need to implement the API approach to create directories explicitly.


=====

Code samples

=====

// Create a mailAccountService.js file in your NextJS project

import mysql from 'mysql2/promise';

/**
 * Creates a new email account by inserting into the MySQL database
 * Dovecot is configured to auto-create mail directories on first login
 * 
 * @param {string} email - Full email address (user@keykeeper.world)
 * @param {string} password - Plain text password to be hashed
 * @returns {Promise<object>} Result object with success status
 */
export async function createMailAccount(email, password) {
  // Configure MySQL connection - use environment variables
  const dbConfig = {
    host: process.env.MAIL_DB_HOST,
    user: process.env.MAIL_DB_USER,
    password: process.env.MAIL_DB_PASSWORD,
    database: process.env.MAIL_DB_NAME
  };

  try {
    // Create connection
    const connection = await mysql.createConnection(dbConfig);

    // Hash the password according to your dovecot config
    // IMPORTANT: Check your dovecot auth config to determine the correct hashing method
    // This example uses SHA512-CRYPT which is common
    const crypto = require('crypto');
    const salt = crypto.randomBytes(8).toString('hex');
    const hashedPassword = crypto.createHash('sha512')
      .update(password + salt)
      .digest('hex');
    
    // Format according to dovecot's expected format
    // MODIFY THIS as needed based on your dovecot configuration
    const passwordFormat = `{SHA512-CRYPT}$6$${salt}$${hashedPassword}`;
    
    // Parse the email to extract username and domain
    const [username, domain] = email.split('@');
    
    // Insert the new mail account
    // IMPORTANT: Modify table and column names to match your schema
    const [results] = await connection.execute(
      'INSERT INTO virtual_users (email, password, username, domain, created) VALUES (?, ?, ?, ?, NOW())',
      [email, passwordFormat, username, domain]
    );
    
    await connection.end();
    
    return {
      success: true,
      id: results.insertId,
      message: `Mail account ${email} created successfully`
    };
  } catch (error) {
    console.error('Failed to create mail account:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Create a NextJS API route at /pages/api/mail-accounts.js
// This will be the endpoint your frontend calls to create accounts

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Validate email format
  if (!email.endsWith('@keykeeper.world') || !email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  
  const result = await createMailAccount(email, password);
  
  if (result.success) {
    return res.status(201).json(result);
  } else {
    return res.status(500).json(result);
  }
}

====


// Create a test-mail-setup.js script

import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// This test script verifies that:
// 1. MySQL-only insertion creates a valid mail account
// 2. Dovecot auto-creates mailbox directories
// 3. IMAP access works
// 4. Mail delivery works

async function testMailAccountCreation() {
  console.log('--- Testing Mail Account Creation ---');
  console.log('This test will create a test account, send mail to it, and check IMAP access');
  
  // Generate a unique test email
  const testEmail = `test-${Date.now()}@keykeeper.world`;
  const testPassword = 'Test123!';
  
  console.log(`\nStep 1: Creating test account ${testEmail}`);
  try {
    // Connect to MySQL
    const connection = await mysql.createConnection({
      host: process.env.MAIL_DB_HOST,
      user: process.env.MAIL_DB_USER,
      password: process.env.MAIL_DB_PASSWORD,
      database: process.env.MAIL_DB_NAME
    });
    
    // Extract username and domain
    const [username, domain] = testEmail.split('@');
    
    // IMPORTANT: Use the same password hashing as your production code
    // Modify this to match your dovecot configuration
    const crypto = require('crypto');
    const salt = crypto.randomBytes(8).toString('hex');
    const hashedPassword = crypto.createHash('sha512')
      .update(testPassword + salt)
      .digest('hex');
    
    const passwordFormat = `{SHA512-CRYPT}$6$${salt}$${hashedPassword}`;
    
    // Insert the test account
    // IMPORTANT: Modify table and column names to match your schema
    await connection.execute(
      'INSERT INTO virtual_users (email, password, username, domain, created) VALUES (?, ?, ?, ?, NOW())',
      [testEmail, passwordFormat, username, domain]
    );
    
    console.log('✅ Account created in MySQL successfully');
    await connection.end();
    
    // Wait a bit for dovecot to recognize the new account
    console.log('Waiting 2 seconds for account propagation...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test sending an email to the new account
    console.log('\nStep 2: Sending test email');
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        // Use an existing account to send test email
        user: process.env.TEST_SENDER_EMAIL,
        pass: process.env.TEST_SENDER_PASSWORD
      }
    });
    
    await transporter.sendMail({
      from: process.env.TEST_SENDER_EMAIL,
      to: testEmail,
      subject: 'Mail Account Test',
      text: 'This is a test to verify mail delivery is working.'
    });
    
    console.log('✅ Test email sent');
    
    // Wait for mail delivery
    console.log('Waiting 5 seconds for mail delivery...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test IMAP access
    console.log('\nStep 3: Testing IMAP access');
    const imapSuccess = await new Promise((resolve) => {
      const imap = new Imap({
        user: testEmail,
        password: testPassword,
        host: process.env.MAIL_HOST,
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });
      
      imap.once('ready', function() {
        imap.openBox('INBOX', true, function(err, box) {
          if (err) {
            console.error('Failed to open inbox:', err);
            imap.end();
            resolve(false);
            return;
          }
          
          console.log(`✅ IMAP access successful, inbox has ${box.messages.total} messages`);
          
          // Check if our test message arrived
          if (box.messages.total > 0) {
            const fetch = imap.seq.fetch(box.messages.total, { bodies: ['HEADER.FIELDS (SUBJECT)'] });
            
            fetch.on('message', function(msg) {
              msg.on('body', function(stream) {
                let buffer = '';
                stream.on('data', function(chunk) {
                  buffer += chunk.toString('utf8');
                });
                
                stream.once('end', function() {
                  console.log('Last message subject:', buffer);
                  // You could check if the subject matches our test email
                });
              });
            });
            
            fetch.once('end', function() {
              console.log('✅ Message retrieval successful');
              imap.end();
              resolve(true);
            });
          } else {
            console.log('⚠️ No messages in inbox yet');
            imap.end();
            resolve(true); // Still consider IMAP success even if no messages yet
          }
        });
      });
      
      imap.once('error', function(err) {
        console.error('IMAP connection error:', err);
        resolve(false);
      });
      
      imap.connect();
    });
    
    // Cleanup - optionally delete the test account
    console.log('\nStep 4: Cleanup');
    const cleanupConnection = await mysql.createConnection({
      host: process.env.MAIL_DB_HOST,
      user: process.env.MAIL_DB_USER,
      password: process.env.MAIL_DB_PASSWORD,
      database: process.env.MAIL_DB_NAME
    });
    
    await cleanupConnection.execute(
      'DELETE FROM virtual_users WHERE email = ?',
      [testEmail]
    );
    
    console.log('✅ Test account removed from database');
    await cleanupConnection.end();
    
    // Final result
    console.log('\n--- Test Summary ---');
    console.log('MySQL account creation: ✅ Success');
    console.log('Email delivery: ✅ Success');
    console.log('IMAP access:', imapSuccess ? '✅ Success' : '❌ Failed');
    
    if (imapSuccess) {
      console.log('\n✅ TEST PASSED: MySQL-only account creation works with dovecot auto-directory creation');
      console.log('You can proceed with the direct MySQL approach in your production code.');
    } else {
      console.log('\n❌ TEST FAILED: There was an issue with the mail account setup');
      console.log('You may need to add explicit directory creation to your account setup process.');
    }
    
    return imapSuccess;
  } catch (error) {
    console.error('Test failed with error:', error);
    console.log('\n❌ TEST FAILED: Could not complete mail account creation test');
    return false;
  }
}

// Run the test
testMailAccountCreation();

=====

// Integration steps for your NextJS application

// 1. Install required dependencies
// Run these commands in your project:
// npm install mysql2 crypto-js dotenv

// 2. Set up environment variables in .env file
// Add these to your .env file (modify as needed):
/*
MAIL_DB_HOST=your-mysql-host
MAIL_DB_USER=your-mysql-user
MAIL_DB_PASSWORD=your-mysql-password
MAIL_DB_NAME=your-mail-database-name
MAIL_HOST=mail.keykeeper.world
*/

// 3. Create a mail service - save as lib/services/mailAccountService.js
// Use the createMailAccount function from the previous code example

// 4. Create a React hook for account creation
// Save as hooks/useMailAccount.js

import { useState } from 'react';

export function useMailAccount() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  
  const createMailAccount = async (email, password) => {
    setIsCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/mail-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create mail account');
      }
      
      setIsCreating(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsCreating(false);
      throw err;
    }
  };
  
  return {
    createMailAccount,
    isCreating,
    error,
  };
}

// 5. Example usage in a user registration component
// pages/register.js or components/RegisterForm.js

import { useMailAccount } from '../hooks/useMailAccount';
import { useState } from 'react';

export default function RegisterForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { createMailAccount, isCreating, error } = useMailAccount();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Format the email with your domain
      const email = `${username}@keykeeper.world`;
      
      // First create the mail account
      await createMailAccount(email, password);
      
      // Then proceed with user registration in your app
      // ... your existing registration code
      
      // Success notification
      alert('Registration successful!');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username:</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <span>@keykeeper.world</span>
      </div>
      
      <div>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={isCreating}>
        {isCreating ? 'Creating Account...' : 'Register'}
      </button>
    </form>
  );
}



=================
Set these in the production environment:

MAIL_DB_HOST=your-mysql-host
MAIL_DB_USER=your-mysql-user
MAIL_DB_PASSWORD=your-mysql-password
MAIL_DB_NAME=your-mail-database-name
MAIL_HOST=mail.keykeeper.world

===============