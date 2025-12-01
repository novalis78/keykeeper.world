import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// Service secret for internal service-to-service auth
const SERVICE_SECRET = process.env.SERVICE_SECRET || 'dev-service-secret';

// Credit costs per operation by service
const SERVICE_COSTS = {
  keyfetch: {
    proxy_request: 0.01  // $0.01 per proxy request
  },
  keyroute: {
    tunnel_hour: 0.10,   // $0.10 per hour of tunnel time
    data_gb: 0.05        // $0.05 per GB transferred
  }
};

/**
 * Verify Agent Token and Check Balance
 *
 * This endpoint is called by KeyFetch/KeyRoute to validate agent tokens
 * and check if they have sufficient credits for the requested operation.
 *
 * POST /api/v1/services/verify
 * Headers:
 *   X-Service-Secret: <service-secret>
 * Body:
 *   {
 *     "token": "kk_xxx...",
 *     "service": "keyfetch" | "keyroute",
 *     "operation": "proxy_request" | "tunnel_hour" | "data_gb",
 *     "quantity": 1
 *   }
 *
 * Response:
 *   {
 *     "valid": true,
 *     "agent_id": "uuid",
 *     "email": "agent@example.com",
 *     "balance": 50.00,
 *     "cost_per_unit": 0.01,
 *     "can_afford": true,
 *     "estimated_operations": 5000
 *   }
 */
export async function POST(request) {
  try {
    // Verify service secret (internal auth between services)
    const serviceSecret = request.headers.get('x-service-secret');
    if (serviceSecret !== SERVICE_SECRET) {
      return NextResponse.json(
        { valid: false, error: 'Invalid service secret' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token, service, operation, quantity = 1 } = body;

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    if (!service || !['keyfetch', 'keyroute'].includes(service)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid service' },
        { status: 400 }
      );
    }

    // Find user by API key (token)
    const user = await db.users.findByApiKey(token);
    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { valid: false, error: 'Account is not active', status: user.status },
        { status: 403 }
      );
    }

    const balance = parseFloat(user.credits || 0);

    // Get cost for this operation
    const serviceCosts = SERVICE_COSTS[service] || {};
    const costPerUnit = operation ? (serviceCosts[operation] || 0.01) : 0.01;
    const totalCost = costPerUnit * quantity;
    const canAfford = balance >= totalCost;
    const estimatedOperations = costPerUnit > 0 ? Math.floor(balance / costPerUnit) : Infinity;

    return NextResponse.json({
      valid: true,
      agent_id: user.id,
      email: user.email,
      account_type: user.account_type,
      balance: balance,
      cost_per_unit: costPerUnit,
      total_cost: totalCost,
      can_afford: canAfford,
      estimated_operations: estimatedOperations
    });
  } catch (error) {
    console.error('Service verify error:', error);
    return NextResponse.json(
      { valid: false, error: 'Verification failed: ' + error.message },
      { status: 500 }
    );
  }
}
