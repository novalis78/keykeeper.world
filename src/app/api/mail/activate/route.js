'use server';

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import pgpUtils from '@/lib/auth/pgp';
import accountManager from '@/lib/mail/accountManager';

/**
 * First Login Mail Account Activation API
 * 
 * This endpoint is called during a user's first login to activate their mail account
 * by updating the password hash with the actual deterministic password derived from
 * their private key.
 */

export const dynamic = 'force-dynamic';

export async function POST(request) {
  console.log('[Mail Activation API] Processing mail account activation request');
  
  // Get current authenticated user
  const user = await getCurrentUser();
  
  if (!user || !user.id) {
    console.error('[Mail Activation API] Not authenticated');
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  console.log(`[Mail Activation API] Processing activation for user: ${user.id} (${user.email})`);
  
  try {
    // Parse request body
    const body = await request.json();
    
    // Verify required fields - we need the derived password from the client
    const { derivedPassword } = body;
    
    if (!derivedPassword) {
      console.error('[Mail Activation API] Missing required field: derivedPassword');
      return NextResponse.json({ error: 'Missing derived password' }, { status: 400 });
    }
    
    console.log(`[Mail Activation API] Received password for activation (first 5 chars: ${derivedPassword.substring(0, 5)}...)`);
    
    // Check if mail account exists and needs activation
    console.log(`[Mail Activation API] Checking mail account status for: ${user.email}`);
    
    // Custom query to check activation status
    const result = await db.query(`
      SELECT id, pending_activation 
      FROM virtual_users 
      WHERE email = ? AND user_id = ?
    `, [user.email, user.id]);
    
    if (!result || result.length === 0) {
      console.error('[Mail Activation API] Mail account not found');
      return NextResponse.json({ error: 'Mail account not found' }, { status: 404 });
    }
    
    const mailAccount = result[0];
    
    // Check if activation is needed
    if (mailAccount.pending_activation !== 1) {
      console.log(`[Mail Activation API] Mail account already activated for ${user.email}`);
      return NextResponse.json({ 
        message: 'Mail account already activated', 
        activated: false,
        alreadyActive: true
      });
    }
    
    // Update the password hash with the derived password
    console.log(`[Mail Activation API] Updating password hash for ${user.email}`);
    
    try {
      console.log(`[Mail Activation API] Using derived password (first 5 chars: ${derivedPassword.substring(0, 5)}...)`);
      
      // Update the password in the virtual_users table
      // Generate a proper SHA512-CRYPT hash with a new salt using OpenSSL
      const { execSync } = require('child_process');
      const crypto = require('crypto');
      
      // Generate a random salt
      const salt = crypto.randomBytes(8).toString('base64')
        .replace(/[+\/=]/g, '.')
        .substring(0, 16);
      
      // Use OpenSSL to generate the proper SHA512-CRYPT hash
      const hash = execSync(`openssl passwd -6 -salt "${salt}" "${derivedPassword}"`).toString().trim();
      const passwordHash = `{SHA512-CRYPT}${hash}`;
      
      console.log(`[Mail Activation API] Generated hash: ${passwordHash.substring(0, 20)}...`);
      
      // Update both password and activation flag in a single query
      await db.query(`
        UPDATE virtual_users 
        SET 
          password = ?,
          pending_activation = 0 
        WHERE email = ? AND user_id = ?
      `, [passwordHash, user.email, user.id]);
      
      console.log(`[Mail Activation API] Successfully activated mail account for ${user.email}`);
      
      // Log the activation
      await db.activityLogs.create(user.id, 'mail_account_activation', {
        email: user.email,
        success: true
      });
      
      return NextResponse.json({
        success: true,
        message: 'Mail account activated successfully',
        activated: true
      });
    } catch (updateError) {
      console.error('[Mail Activation API] Error updating password:', updateError);
      
      await db.activityLogs.create(user.id, 'mail_account_activation', {
        email: user.email,
        success: false,
        error: updateError.message
      });
      
      return NextResponse.json({ 
        error: 'Failed to update mail account password',
        details: updateError.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Mail Activation API] General error during activation:', error);
    return NextResponse.json({ 
      error: 'Error processing activation request',
      details: error.message 
    }, { status: 500 });
  }
}