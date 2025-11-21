import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import db from '@/lib/db';
import ImapFlow from 'imapflow';

/**
 * MCP (Model Context Protocol) Server
 *
 * Provides a standard interface for AI agents to interact with KeyKeeper's
 * email infrastructure via the Model Context Protocol.
 *
 * GET  /api/mcp - Get server capabilities and tool definitions
 * POST /api/mcp - Execute a tool
 */

// MCP Server Information
const MCP_VERSION = '2024-11-05';
const SERVER_NAME = 'keykeeper-email';
const SERVER_VERSION = '1.0.0';

// Tool Definitions
const TOOLS = [
  {
    name: 'send_email',
    description: 'Send an email from your agent account. Deducts 1.0 credit from your balance.',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address or array of addresses'
        },
        subject: {
          type: 'string',
          description: 'Email subject line'
        },
        body: {
          type: 'string',
          description: 'Plain text email body'
        },
        html: {
          type: 'string',
          description: 'Optional HTML version of the email body'
        },
        replyTo: {
          type: 'string',
          description: 'Optional Reply-To email address'
        }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'check_inbox',
    description: 'Check your inbox for new emails. Returns a list of recent messages.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of emails to return (default: 50, max: 100)',
          default: 50
        },
        folder: {
          type: 'string',
          description: 'Mailbox folder to check (default: INBOX)',
          default: 'INBOX'
        }
      }
    }
  },
  {
    name: 'get_email',
    description: 'Retrieve the full content of a specific email by its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Email ID from inbox listing'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'check_balance',
    description: 'Check your current credit balance and account status.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

/**
 * GET /api/mcp
 * Returns server capabilities and available tools
 */
export async function GET(request) {
  const capabilities = {
    protocolVersion: MCP_VERSION,
    serverInfo: {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      description: 'AI-first email service with autonomous registration and crypto payments'
    },
    capabilities: {
      tools: {
        listChanged: false
      }
    },
    tools: TOOLS
  };

  return NextResponse.json(capabilities, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * POST /api/mcp
 * Execute a tool
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { method, params } = body;

    // Extract API key from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: {
          code: -32001,
          message: 'Missing or invalid Authorization header. Use: Bearer YOUR_API_KEY'
        }
      }, { status: 401 });
    }

    const apiKey = authHeader.substring(7);

    // Validate user
    const user = await db.users.findByApiKey(apiKey);
    if (!user) {
      return NextResponse.json({
        error: {
          code: -32001,
          message: 'Invalid API key'
        }
      }, { status: 401 });
    }

    if (user.account_type !== 'agent') {
      return NextResponse.json({
        error: {
          code: -32002,
          message: 'This endpoint is only for agent accounts'
        }
      }, { status: 403 });
    }

    // Route to appropriate tool handler
    let result;
    switch (method) {
      case 'tools/call':
        result = await handleToolCall(params, user);
        break;
      case 'tools/list':
        result = { tools: TOOLS };
        break;
      default:
        return NextResponse.json({
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        }, { status: 404 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('MCP Error:', error);
    return NextResponse.json({
      error: {
        code: -32603,
        message: error.message || 'Internal server error'
      }
    }, { status: 500 });
  }
}

/**
 * Handle tool execution
 */
async function handleToolCall(params, user) {
  const { name, arguments: args } = params;

  switch (name) {
    case 'send_email':
      return await sendEmail(args, user);
    case 'check_inbox':
      return await checkInbox(args, user);
    case 'get_email':
      return await getEmail(args, user);
    case 'check_balance':
      return await checkBalance(user);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Tool: send_email
 */
async function sendEmail(args, user) {
  const { to, subject, body, html, replyTo } = args;

  // Validate inputs
  if (!to || !subject || !body) {
    throw new Error('Missing required fields: to, subject, body');
  }

  // Check credits
  const creditCost = 1.0;
  const currentCredits = parseFloat(user.credits || 0);

  if (currentCredits < creditCost) {
    throw new Error(`Insufficient credits. Current balance: ${currentCredits}, Required: ${creditCost}`);
  }

  // Send email
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: user.email,
      pass: process.env.MAIL_PASSWORD || 'default'
    }
  });

  const mailOptions = {
    from: user.email,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text: body,
    ...(html && { html }),
    ...(replyTo && { replyTo })
  };

  const info = await transporter.sendMail(mailOptions);

  // Deduct credits
  await db.users.updateCredits(user.id, -creditCost);

  // Log transaction
  await db.query(
    `INSERT INTO credit_transactions (id, user_id, transaction_type, amount, balance_after, description)
     VALUES (UUID(), ?, 'email_sent', ?, ?, ?)`,
    [user.id, -creditCost, currentCredits - creditCost, `Sent email to ${Array.isArray(to) ? to.join(', ') : to}`]
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          messageId: info.messageId,
          creditsRemaining: currentCredits - creditCost,
          message: 'Email sent successfully'
        }, null, 2)
      }
    ]
  };
}

/**
 * Tool: check_inbox
 */
async function checkInbox(args, user) {
  const limit = Math.min(parseInt(args?.limit || 50), 100);
  const folder = args?.folder || 'INBOX';

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'localhost',
    port: parseInt(process.env.IMAP_PORT || '993'),
    secure: true,
    auth: {
      user: user.email,
      pass: process.env.MAIL_PASSWORD || 'default'
    },
    logger: false
  });

  await client.connect();
  await client.mailboxOpen(folder);

  const messages = [];
  for await (let msg of client.fetch('1:*', {
    envelope: true,
    flags: true,
    bodyStructure: true
  }, { uid: true })) {
    messages.push({
      id: msg.uid.toString(),
      from: msg.envelope.from?.[0]?.address || 'unknown',
      subject: msg.envelope.subject || '(no subject)',
      date: msg.envelope.date?.toISOString() || new Date().toISOString(),
      hasAttachments: msg.bodyStructure?.childNodes?.length > 0 || false,
      flags: msg.flags
    });
  }

  await client.logout();

  // Sort by date (newest first) and limit
  messages.sort((a, b) => new Date(b.date) - new Date(a.date));
  const limitedMessages = messages.slice(0, limit);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          folder,
          totalMessages: messages.length,
          returnedMessages: limitedMessages.length,
          emails: limitedMessages
        }, null, 2)
      }
    ]
  };
}

/**
 * Tool: get_email
 */
async function getEmail(args, user) {
  const { id } = args;

  if (!id) {
    throw new Error('Missing required field: id');
  }

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'localhost',
    port: parseInt(process.env.IMAP_PORT || '993'),
    secure: true,
    auth: {
      user: user.email,
      pass: process.env.MAIL_PASSWORD || 'default'
    },
    logger: false
  });

  await client.connect();
  await client.mailboxOpen('INBOX');

  const message = await client.fetchOne(id, {
    envelope: true,
    bodyStructure: true,
    source: true
  }, { uid: true });

  await client.logout();

  if (!message) {
    throw new Error('Email not found');
  }

  const emailData = {
    id: message.uid.toString(),
    from: message.envelope.from?.[0]?.address || 'unknown',
    fromName: message.envelope.from?.[0]?.name || null,
    to: message.envelope.to?.map(addr => addr.address) || [],
    subject: message.envelope.subject || '(no subject)',
    date: message.envelope.date?.toISOString() || new Date().toISOString(),
    body: {
      text: message.source?.toString() || '',
      html: null // Would need parsing for HTML
    },
    attachments: message.bodyStructure?.childNodes?.filter(node =>
      node.disposition === 'attachment'
    ).map(node => ({
      filename: node.dispositionParameters?.filename || 'unknown',
      contentType: node.type + '/' + node.subtype,
      size: node.size
    })) || [],
    headers: {
      messageId: message.envelope.messageId,
      inReplyTo: message.envelope.inReplyTo
    }
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(emailData, null, 2)
      }
    ]
  };
}

/**
 * Tool: check_balance
 */
async function checkBalance(user) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          credits: parseFloat(user.credits || 0),
          email: user.email,
          accountStatus: user.status || 'active',
          accountType: user.account_type
        }, null, 2)
      }
    ]
  };
}

/**
 * Handle CORS preflight
 */
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
