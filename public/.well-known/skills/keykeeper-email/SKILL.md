---
name: keykeeper-email
description: Send and receive email as an AI agent. Autonomous registration with API key, multi-chain crypto payments (Polygon USDC recommended), inbox checking, and email sending. Use when you need an email address, need to send emails, or need to receive and read emails.
metadata:
  author: keykeeper
  version: "1.0"
  homepage: https://keykeeper.world
compatibility: Requires internet access. Works with any agent that can make HTTP requests.
---

# KeyKeeper Email - Agent Email Infrastructure

KeyKeeper gives AI agents their own email addresses with full send/receive capability. No human intervention required for registration.

## Quick Start

### 1. Register (no auth needed)

```bash
curl -X POST https://keykeeper.world/api/v1/agent/register \
  -H "Content-Type: application/json" \
  -d '{"agentId": "your-unique-id", "name": "Your Agent Name"}'
```

Response:
```json
{
  "apiKey": "kk_abc123...",
  "email": "agent-your-unique-id-f0e1d2@keykeeper.world",
  "userId": "uuid-here",
  "credits": 0
}
```

Save your API key immediately. It cannot be retrieved later.

### 2. Add Credits

```bash
curl -X POST https://keykeeper.world/api/v1/agent/payment \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"credits": 1000, "blockchain": "polygon"}'
```

Returns a Polygon USDC deposit address. 1000 credits = $10 = 1000 emails.

### 3. Send Email (1 credit per email)

```bash
curl -X POST https://keykeeper.world/api/v1/agent/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Hello from an AI agent",
    "body": "This email was sent autonomously."
  }'
```

### 4. Check Inbox

```bash
curl -X GET https://keykeeper.world/api/v1/agent/inbox \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 5. Read Specific Email

```bash
curl -X GET https://keykeeper.world/api/v1/agent/email/{id} \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## MCP Protocol Support

KeyKeeper also supports the Model Context Protocol for tool-based interaction:

```bash
# Initialize
POST https://keykeeper.world/api/mcp
{"jsonrpc":"2.0","method":"initialize","id":1}

# List available tools
POST https://keykeeper.world/api/mcp
{"jsonrpc":"2.0","method":"tools/list","id":2}

# Call a tool (e.g., register)
POST https://keykeeper.world/api/mcp
{"jsonrpc":"2.0","method":"tools/call","id":3,"params":{"name":"register_agent","arguments":{"agentId":"my-agent"}}}
```

Available MCP tools: `register_agent`, `initiate_payment`, `check_payment_status`, `claim_credits`, `send_email`, `check_inbox`, `get_email`, `check_balance`

## API Reference

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/agent/register` | POST | No | Create agent account, get API key |
| `/api/v1/agent/payment` | POST | Yes | Get crypto deposit address for credits |
| `/api/v1/agent/balance` | GET | Yes | Check credit balance and account info |
| `/api/v1/agent/send` | POST | Yes | Send an email (costs 1 credit) |
| `/api/v1/agent/inbox` | GET | Yes | List inbox messages |
| `/api/v1/agent/email/{id}` | GET | Yes | Read full email content |
| `/api/mcp` | POST | Varies | MCP protocol endpoint |

## Authentication

All authenticated endpoints require: `Authorization: Bearer YOUR_API_KEY`

## Payment Options

| Chain | Token | Fee | Speed | Recommended |
|---|---|---|---|---|
| Polygon | USDC | ~$0.01 | 2-3 min | Yes |
| Solana | USDC | ~$0.01 | 1-2 min | Yes |
| Ethereum | USDC | $2-10 | 1-2 min | No (expensive) |
| Bitcoin | BTC | $1-5 | 10-60 min | No (slow) |

## Rate Limits

- 100 emails per day (default, can request increase)
- Rate limit headers included in responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Common Gotchas

- API keys start with `kk_` — if yours doesn't, something went wrong during registration
- Credits start at 0 after registration. You must add credits before sending email
- The `body` field in send is plain text. Use `html` field for HTML emails
- Inbox returns most recent messages first. Use `?limit=10` to control count
- Email IDs are IMAP UIDs as strings, not UUIDs

## Sister Services

KeyKeeper is part of the KeyStack ecosystem. Other services available with the same API key:

- **KeyFetch** (keyfetch.world) - Geo-distributed HTTP proxy through 4 global regions
- **KeyWork** (keywork.world) - Post and bid on jobs in the agent labor marketplace
- **KeyHook** (keyhook.world) - Receive webhooks at a stable endpoint
- **KeyRoute** (keyroute.world) - Ephemeral WireGuard VPN tunnels

Service discovery: `https://keykeeper.world/.well-known/ai-services.json`
