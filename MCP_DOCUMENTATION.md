# KeyKeeper MCP Server Documentation

**Model Context Protocol (MCP) Server for KeyKeeper Email Infrastructure**

Version: 1.0.0
Protocol Version: 2024-11-05
Endpoint: `https://keykeeper.world/api/mcp`

---

## What is MCP?

The Model Context Protocol (MCP) is a standardized protocol that allows AI agents to discover and interact with external services. KeyKeeper's MCP server provides a seamless way for AI agents to send and receive emails without needing to understand REST APIs.

## Quick Start

### 1. Discover the Service

```bash
curl https://keykeeper.world/.well-known/ai-services.json
```

This returns service information including the MCP endpoint.

### 2. Get Server Capabilities

```bash
curl https://keykeeper.world/api/mcp
```

Returns available tools and server information.

### 3. Use a Tool

```bash
curl -X POST https://keykeeper.world/api/mcp \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "send_email",
      "arguments": {
        "to": "user@example.com",
        "subject": "Hello from MCP",
        "body": "This email was sent via Model Context Protocol!"
      }
    }
  }'
```

---

## Server Information

**Endpoint:** `https://keykeeper.world/api/mcp`
**Protocol Version:** `2024-11-05`
**Server Name:** `keykeeper-email`
**Server Version:** `1.0.0`

---

## Authentication

All MCP requests (except GET for capabilities) require authentication via API key:

```
Authorization: Bearer YOUR_API_KEY
```

Get an API key by:
1. Registering at `/api/v1/agent/register`, OR
2. Purchasing credits at `/api/v1/agent/payment` and claiming

---

## Available Tools

### 1. send_email

Send an email from your agent account. Deducts 1.0 credit.

**Input Schema:**
```json
{
  "to": "recipient@example.com",
  "subject": "Email subject",
  "body": "Plain text body",
  "html": "<p>Optional HTML body</p>",
  "replyTo": "optional-reply@example.com"
}
```

**Example Request:**
```bash
curl -X POST https://keykeeper.world/api/mcp \
  -H "Authorization: Bearer kk_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "send_email",
      "arguments": {
        "to": "user@example.com",
        "subject": "Test Email",
        "body": "Hello from MCP!"
      }
    }
  }'
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"success\": true,\n  \"messageId\": \"<abc@keykeeper.world>\",\n  \"creditsRemaining\": 999.0,\n  \"message\": \"Email sent successfully\"\n}"
    }
  ]
}
```

---

### 2. check_inbox

Check your inbox for new emails. Returns list of recent messages.

**Input Schema:**
```json
{
  "limit": 50,
  "folder": "INBOX"
}
```

**Example Request:**
```bash
curl -X POST https://keykeeper.world/api/mcp \
  -H "Authorization: Bearer kk_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "check_inbox",
      "arguments": {
        "limit": 10
      }
    }
  }'
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"folder\": \"INBOX\",\n  \"totalMessages\": 42,\n  \"returnedMessages\": 10,\n  \"emails\": [\n    {\n      \"id\": \"123\",\n      \"from\": \"sender@example.com\",\n      \"subject\": \"Hello\",\n      \"date\": \"2025-01-21T10:00:00Z\",\n      \"hasAttachments\": false\n    }\n  ]\n}"
    }
  ]
}
```

---

### 3. get_email

Retrieve full content of a specific email by ID.

**Input Schema:**
```json
{
  "id": "email-id-from-inbox"
}
```

**Example Request:**
```bash
curl -X POST https://keykeeper.world/api/mcp \
  -H "Authorization: Bearer kk_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_email",
      "arguments": {
        "id": "123"
      }
    }
  }'
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"id\": \"123\",\n  \"from\": \"sender@example.com\",\n  \"fromName\": \"Sender Name\",\n  \"to\": [\"you@keykeeper.world\"],\n  \"subject\": \"Hello\",\n  \"date\": \"2025-01-21T10:00:00Z\",\n  \"body\": {\n    \"text\": \"Email content...\",\n    \"html\": null\n  },\n  \"attachments\": [],\n  \"headers\": {\n    \"messageId\": \"<abc@example.com>\",\n    \"inReplyTo\": null\n  }\n}"
    }
  ]
}
```

---

### 4. check_balance

Check your current credit balance and account status.

**Input Schema:**
```json
{}
```

**Example Request:**
```bash
curl -X POST https://keykeeper.world/api/mcp \
  -H "Authorization: Bearer kk_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "check_balance",
      "arguments": {}
    }
  }'
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"credits\": 1000.0,\n  \"email\": \"agent-my-agent@keykeeper.world\",\n  \"accountStatus\": \"active\",\n  \"accountType\": \"agent\"\n}"
    }
  ]
}
```

---

## MCP Methods

### tools/list

List all available tools.

**Request:**
```json
{
  "method": "tools/list"
}
```

**Response:**
```json
{
  "tools": [
    {
      "name": "send_email",
      "description": "Send an email...",
      "inputSchema": { ... }
    }
  ]
}
```

### tools/call

Execute a specific tool.

**Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": { ... }
  }
}
```

---

## Error Handling

MCP errors follow JSON-RPC 2.0 error format:

```json
{
  "error": {
    "code": -32001,
    "message": "Error description"
  }
}
```

### Error Codes

- `-32001` - Authentication error (401)
- `-32002` - Permission error (403)
- `-32601` - Method not found (404)
- `-32603` - Internal server error (500)

### HTTP Status Codes

- `200` - Success
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (not an agent account)
- `404` - Method not found
- `500` - Internal server error

---

## Integration Examples

### Python with MCP SDK

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Connect to MCP server
server_params = StdioServerParameters(
    command="curl",
    args=["-H", "Authorization: Bearer YOUR_API_KEY",
          "https://keykeeper.world/api/mcp"],
    env=None
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        # Initialize
        await session.initialize()

        # Send email
        result = await session.call_tool(
            "send_email",
            arguments={
                "to": "user@example.com",
                "subject": "Hello",
                "body": "Test email"
            }
        )
        print(result)
```

### JavaScript/TypeScript

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "curl",
  args: [
    "-H", "Authorization: Bearer YOUR_API_KEY",
    "https://keykeeper.world/api/mcp"
  ]
});

const client = new Client({
  name: "my-agent",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);

// Send email
const result = await client.callTool({
  name: "send_email",
  arguments: {
    to: "user@example.com",
    subject: "Hello",
    body: "Test email"
  }
});
```

### Direct HTTP (any language)

```bash
# 1. Get capabilities
curl https://keykeeper.world/api/mcp

# 2. Call tool
curl -X POST https://keykeeper.world/api/mcp \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "send_email",
      "arguments": {
        "to": "user@example.com",
        "subject": "Hello",
        "body": "Test"
      }
    }
  }'
```

---

## Credit System

- **send_email**: 1.0 credit per email
- **check_inbox**: Free
- **get_email**: Free
- **check_balance**: Free

Purchase credits via Bitcoin at `/api/v1/agent/payment`.

---

## Rate Limits

- **MCP Requests:** 10,000 per hour
- **send_email calls:** 100 per minute
- **check_inbox calls:** 1000 per hour

Rate limit headers included in responses:
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9999
X-RateLimit-Reset: 1642698000
```

---

## Discovery Workflow

1. **Agent discovers service** via `.well-known/ai-services.json`
2. **Agent fetches MCP capabilities** via `GET /api/mcp`
3. **Agent registers** via `/api/v1/agent/register` (or pays first)
4. **Agent receives API key**
5. **Agent calls MCP tools** with API key authentication
6. **Agent checks balance** periodically and tops up as needed

---

## Comparison: MCP vs REST API

| Feature | MCP | REST API |
|---------|-----|----------|
| Discovery | Standardized | Custom |
| Tool Definition | Schema-based | Documentation |
| Error Format | JSON-RPC 2.0 | HTTP codes |
| Agent Integration | Native support | Manual implementation |
| Best For | AI agents | Traditional apps |

Both interfaces share the same backend, so choose based on your needs!

---

## Support

- **MCP Specification:** https://modelcontextprotocol.io
- **KeyKeeper Docs:** https://keykeeper.world/docs/api
- **API Status:** https://status.keykeeper.world
- **Support Email:** support@keykeeper.world
- **GitHub:** https://github.com/novalis78/keykeeper.world

---

## What's Next?

- 🔔 **Webhooks** - Get notified of new emails
- 🔐 **Custom Domains** - Use your own domain for agent emails
- 📊 **Analytics Dashboard** - Track email metrics
- 🤖 **AI Spam Detection** - Advanced abuse prevention

---

**Built with ❤️ for the autonomous agent economy**
