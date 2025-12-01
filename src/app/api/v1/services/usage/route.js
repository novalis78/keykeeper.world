import { NextResponse } from 'next/server';
import db, { query } from '@/lib/db';
import crypto from 'crypto';

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
 * Report Service Usage and Deduct Credits
 *
 * This endpoint is called by KeyFetch/KeyRoute to report usage
 * and deduct credits from agent accounts.
 *
 * POST /api/v1/services/usage
 * Headers:
 *   X-Service-Secret: <service-secret>
 * Body:
 *   {
 *     "service": "keyfetch" | "keyroute",
 *     "region": "us-east" | "eu-west" | etc,
 *     "records": [
 *       {
 *         "agent_id": "uuid",
 *         "operation": "proxy_request",
 *         "quantity": 10,
 *         "timestamp": "2024-01-01T00:00:00Z",
 *         "metadata": { "target_domain": "example.com" }
 *       }
 *     ]
 *   }
 *
 * Response:
 *   {
 *     "processed": 10,
 *     "total_credits_deducted": 0.10,
 *     "results": [
 *       { "agent_id": "uuid", "credits_deducted": 0.10, "new_balance": 49.90 }
 *     ]
 *   }
 */
export async function POST(request) {
  try {
    // Verify service secret (internal auth between services)
    const serviceSecret = request.headers.get('x-service-secret');
    if (serviceSecret !== SERVICE_SECRET) {
      return NextResponse.json(
        { error: 'Invalid service secret' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { service, region, records } = body;

    if (!service || !['keyfetch', 'keyroute'].includes(service)) {
      return NextResponse.json(
        { error: 'Invalid service' },
        { status: 400 }
      );
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'Records array is required' },
        { status: 400 }
      );
    }

    const serviceCosts = SERVICE_COSTS[service] || {};
    const results = [];
    let totalCreditsDeducted = 0;

    // Group records by agent_id for batch processing
    const agentUsage = {};
    for (const record of records) {
      const { agent_id, operation, quantity = 1 } = record;
      if (!agent_id) continue;

      const costPerUnit = serviceCosts[operation] || 0.01;
      const cost = costPerUnit * quantity;

      if (!agentUsage[agent_id]) {
        agentUsage[agent_id] = {
          total_cost: 0,
          operations: []
        };
      }
      agentUsage[agent_id].total_cost += cost;
      agentUsage[agent_id].operations.push({
        operation,
        quantity,
        cost,
        timestamp: record.timestamp,
        metadata: record.metadata
      });
    }

    // Process each agent's usage
    for (const [agentId, usage] of Object.entries(agentUsage)) {
      try {
        // Get current balance
        const userResult = await query('SELECT id, credits FROM users WHERE id = ?', [agentId]);
        if (userResult.length === 0) {
          results.push({
            agent_id: agentId,
            error: 'Agent not found',
            credits_deducted: 0
          });
          continue;
        }

        const user = userResult[0];
        const currentBalance = parseFloat(user.credits || 0);
        const deductAmount = Math.min(usage.total_cost, currentBalance); // Don't go negative
        const newBalance = currentBalance - deductAmount;

        // Deduct credits
        if (deductAmount > 0) {
          await db.users.updateCredits(agentId, -deductAmount);

          // Log the transaction
          const transactionId = crypto.randomUUID();
          const description = `${service} usage: ${usage.operations.length} operations from ${region || 'unknown'}`;

          await query(
            `INSERT INTO credit_transactions (id, user_id, transaction_type, amount, balance_after, description, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [transactionId, agentId, `${service}_usage`, -deductAmount, newBalance, description]
          );

          totalCreditsDeducted += deductAmount;
        }

        results.push({
          agent_id: agentId,
          credits_deducted: deductAmount,
          new_balance: newBalance,
          operations_count: usage.operations.length
        });
      } catch (err) {
        console.error(`Error processing usage for agent ${agentId}:`, err);
        results.push({
          agent_id: agentId,
          error: err.message,
          credits_deducted: 0
        });
      }
    }

    return NextResponse.json({
      processed: records.length,
      total_credits_deducted: totalCreditsDeducted,
      results: results
    });
  } catch (error) {
    console.error('Service usage error:', error);
    return NextResponse.json(
      { error: 'Usage reporting failed: ' + error.message },
      { status: 500 }
    );
  }
}
