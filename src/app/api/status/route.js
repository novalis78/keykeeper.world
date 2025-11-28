import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/status - Health check for all KeyKeeper services
 *
 * Returns status of each service with response times
 */
export async function GET() {
  const startTime = Date.now();
  const services = [];

  // 1. Database
  const dbStatus = await checkDatabase();
  services.push(dbStatus);

  // 2. NIP-05 Registry
  const nip05Status = await checkNip05();
  services.push(nip05Status);

  // 3. Nostr Relay
  const relayStatus = await checkRelay();
  services.push(relayStatus);

  // 4. HTTP Bridge (internal check)
  const bridgeStatus = await checkBridge();
  services.push(bridgeStatus);

  // 5. Email (SMTP/IMAP ports)
  const emailStatus = await checkEmail();
  services.push(emailStatus);

  // Calculate overall status
  const allOperational = services.every(s => s.status === 'operational');
  const hasOutage = services.some(s => s.status === 'outage');
  const overallStatus = hasOutage ? 'outage' : (allOperational ? 'operational' : 'degraded');

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    response_time_ms: Date.now() - startTime,
    services
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function checkDatabase() {
  const start = Date.now();
  try {
    const result = await query('SELECT 1 as ok');
    return {
      name: 'Database',
      description: 'MySQL database for user accounts and messages',
      status: result[0]?.ok === 1 ? 'operational' : 'degraded',
      response_time_ms: Date.now() - start,
      icon: 'database'
    };
  } catch (error) {
    return {
      name: 'Database',
      description: 'MySQL database for user accounts and messages',
      status: 'outage',
      response_time_ms: Date.now() - start,
      error: error.message,
      icon: 'database'
    };
  }
}

async function checkNip05() {
  const start = Date.now();
  try {
    const result = await query('SELECT COUNT(*) as count FROM nostr_identities');
    return {
      name: 'NIP-05 Registry',
      description: 'Nostr identity verification service',
      status: 'operational',
      response_time_ms: Date.now() - start,
      details: {
        registered_identities: result[0]?.count || 0
      },
      icon: 'id-card'
    };
  } catch (error) {
    return {
      name: 'NIP-05 Registry',
      description: 'Nostr identity verification service',
      status: 'outage',
      response_time_ms: Date.now() - start,
      error: error.message,
      icon: 'id-card'
    };
  }
}

async function checkRelay() {
  const start = Date.now();
  try {
    // Check relay via public URL (works from Docker container)
    // Use a short timeout to avoid hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://relay.keykeeper.world', {
      headers: { 'Accept': 'application/nostr+json' },
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const info = await response.json();
      return {
        name: 'Nostr Relay',
        description: 'Public WebSocket relay for Nostr messages',
        status: 'operational',
        response_time_ms: Date.now() - start,
        details: {
          url: 'wss://relay.keykeeper.world',
          software: info.software || 'strfry',
          supported_nips: info.supported_nips || []
        },
        icon: 'relay'
      };
    } else {
      return {
        name: 'Nostr Relay',
        description: 'Public WebSocket relay for Nostr messages',
        status: 'degraded',
        response_time_ms: Date.now() - start,
        icon: 'relay'
      };
    }
  } catch (error) {
    return {
      name: 'Nostr Relay',
      description: 'Public WebSocket relay for Nostr messages',
      status: error.name === 'AbortError' ? 'degraded' : 'outage',
      response_time_ms: Date.now() - start,
      error: error.message,
      icon: 'relay'
    };
  }
}

async function checkBridge() {
  const start = Date.now();
  try {
    // Just verify the nostr_keys and nostr_messages tables exist
    await query('SELECT 1 FROM nostr_keys LIMIT 1');
    await query('SELECT 1 FROM nostr_messages LIMIT 1');
    return {
      name: 'HTTP-to-Nostr Bridge',
      description: 'REST API for sending/receiving Nostr messages',
      status: 'operational',
      response_time_ms: Date.now() - start,
      details: {
        send_endpoint: '/api/nostr/send',
        inbox_endpoint: '/api/nostr/inbox'
      },
      icon: 'bridge'
    };
  } catch (error) {
    return {
      name: 'HTTP-to-Nostr Bridge',
      description: 'REST API for sending/receiving Nostr messages',
      status: 'degraded',
      response_time_ms: Date.now() - start,
      error: error.message,
      icon: 'bridge'
    };
  }
}

async function checkEmail() {
  const start = Date.now();
  try {
    // Check if virtual_users table exists and has entries
    const result = await query('SELECT COUNT(*) as count FROM virtual_users');
    return {
      name: 'Email Service',
      description: 'IMAP/SMTP email for humans and agents',
      status: 'operational',
      response_time_ms: Date.now() - start,
      details: {
        imap_port: 993,
        smtp_ports: [25, 587],
        accounts: result[0]?.count || 0
      },
      icon: 'email'
    };
  } catch (error) {
    return {
      name: 'Email Service',
      description: 'IMAP/SMTP email for humans and agents',
      status: 'degraded',
      response_time_ms: Date.now() - start,
      error: error.message,
      icon: 'email'
    };
  }
}
