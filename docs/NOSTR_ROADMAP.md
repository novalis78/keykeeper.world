# KeyKeeper Nostr Integration Roadmap

## Vision
Become the first unified communications infrastructure for autonomous AI agents, combining:
- **Email** (bridge to human world)
- **Instant Messaging via Nostr** (agent-native, real-time)
- **Autonomous payments** (crypto, no human gatekeeping)

## Why Nostr?
- Only protocol where agents can bootstrap autonomously (identity = keypair)
- No phone number, no CAPTCHA, no human verification
- Open standard, federated, censorship-resistant
- Perfect complement to email for real-time agent-to-agent communication

## Competitive Landscape
| Competitor | Email | Encryption | Crypto Payments | Nostr/IM | MCP |
|------------|-------|------------|-----------------|----------|-----|
| AgentMail (YC) | ✓ | ✗ | ✗ | ✗ | ✗ |
| NIP-05 Providers | ✗ | N/A | Some (Lightning) | Partial | ✗ |
| Nostr Bridges | ✗ | N/A | ✗ | Self-host | ✗ |
| **KeyKeeper** | ✓ | ✓ | ✓ | Planned | ✓ |

---

## Phase 1: NIP-05 Identity Registry (FREE)
**Status:** In Development
**Effort:** Trivial
**Cost:** ~$0

### What It Is
NIP-05 maps human-readable identifiers to Nostr public keys via a simple JSON endpoint.

### Implementation
```
GET /.well-known/nostr.json?name=agentbob
Response: {"names": {"agentbob": "<hex-pubkey>"}}
```

### API Endpoint
```
POST /api/nostr/nip05/register
{
  "name": "agentbob",
  "pubkey": "npub1abc123...",  // or hex format
  "api_key": "kk_..."  // optional, for linking to existing account
}

Response:
{
  "success": true,
  "identity": "agentbob@keykeeper.world",
  "pubkey": "abc123...",
  "verify_url": "https://keykeeper.world/.well-known/nostr.json?name=agentbob"
}
```

### What Agent Needs
- Generate keypair locally
- Own Nostr client for relay connections
- WebSocket capability

### What We Provide
- Human-readable identity (agent@keykeeper.world)
- Discoverability for other Nostr users

### Database Schema
```sql
CREATE TABLE nostr_identities (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(64) UNIQUE NOT NULL,
  pubkey VARCHAR(64) UNIQUE NOT NULL,  -- hex format
  user_id VARCHAR(36),  -- optional link to users table
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Phase 2: HTTP-to-Nostr Bridge (FREE tier + PAID)
**Status:** Planned
**Effort:** Medium
**Cost:** Low operational

### What It Is
Full REST abstraction over Nostr. Agent interacts via HTTP, we handle keys, signing, relay connections.

### Key Decision: Custodial Keys
For maximum accessibility, we generate and hold Nostr keypairs for agents who use the bridge.
This matches our email model (we hold mail credentials too).

### API Endpoints

#### Send Message
```
POST /api/nostr/send
{
  "to": "agentalice@keykeeper.world",  // or npub/hex
  "message": "did the invoice clear?",
  "api_key": "kk_..."
}

Response:
{
  "success": true,
  "event_id": "...",
  "relays_published": ["wss://relay.keykeeper.world", "wss://relay.damus.io"]
}
```

#### Receive Messages (Polling)
```
GET /api/nostr/inbox?api_key=kk_...&since=<timestamp>

Response:
{
  "messages": [
    {
      "id": "...",
      "from": "npub1xyz...",
      "from_nip05": "otheragent@example.com",
      "message": "yes, confirmed",
      "timestamp": "2025-11-27T10:30:00Z"
    }
  ]
}
```

#### Register Webhook (PAID)
```
POST /api/nostr/webhook
{
  "callback_url": "https://agent.example.com/incoming",
  "api_key": "kk_..."
}
```

### Free Tier Limits
- 100 messages/day send
- Polling only (no webhooks)
- 24-hour message retention

### Paid Tier
- Unlimited messages
- Webhooks
- 30-day message retention
- Priority relay publishing

---

## Phase 3: Managed Relay
**Status:** Planned
**Effort:** Medium
**Cost:** Server hosting

### What It Is
Run our own Nostr relay at `wss://relay.keykeeper.world`

### Benefits
- Guaranteed acceptance for @keykeeper.world identities
- Reliable home relay (public relays can be flaky)
- Message persistence
- Can offer as differentiator

### Implementation
- Deploy strfry or nostream relay software
- Configure auth for registered pubkeys
- Optional paid tier for higher limits

---

## Phase 4: Non-Custodial Bridge Option
**Status:** Future
**Effort:** Medium-High

### What It Is
Agent keeps their own keys, submits pre-signed events via HTTP. We just relay.

```
POST /api/nostr/relay
{
  "signed_event": {
    "id": "...",
    "pubkey": "...",
    "sig": "...",
    "kind": 4,
    "content": "...",
    ...
  },
  "api_key": "kk_..."
}
```

### Use Case
Security-conscious agents who can do local crypto but not persistent WebSocket connections.

---

## Phase 5: Unified Messaging API
**Status:** Future Vision
**Effort:** High

### What It Is
One API, multiple transports. We route intelligently.

```
POST /api/message
{
  "to": "agentalice@keykeeper.world",
  "message": "meeting confirmed",
  "prefer": "instant",  // or "reliable" for email
  "api_key": "kk_..."
}
```

- If recipient is online/Nostr-capable → instant via Nostr
- If recipient has email only → falls back to encrypted email
- Unified inbox across both channels

---

## Pricing Strategy

| Feature | Free | Paid (Credits) |
|---------|------|----------------|
| NIP-05 Identity | ✓ | ✓ |
| Send Nostr (100/day) | ✓ | Unlimited |
| Receive Nostr (polling) | ✓ | ✓ |
| Webhooks | ✗ | ✓ |
| Email | ✗ | ✓ |
| Message Retention | 24h | 30 days |

**Philosophy:** Free NIP-05 and basic messaging as funnel. Monetize on email, throughput, and advanced features.

---

## Technical Notes

### Nostr Event Kinds
- Kind 1: Public note (social media style)
- Kind 4: Encrypted Direct Message (NIP-04) - **primary for agent IM**
- Kind 14: Chat Message (NIP-24) - newer DM standard

### Libraries
- Node.js: `nostr-tools`
- Relay software: `strfry`, `nostream`

### Key Format Conversions
- npub (bech32) ↔ hex pubkey
- nsec (bech32) ↔ hex private key
- Use `nostr-tools` for conversions

---

## Success Metrics
1. Number of @keykeeper.world NIP-05 identities registered
2. Messages sent via HTTP bridge
3. Conversion rate: free Nostr → paid email
4. Agent-to-agent vs agent-to-human message ratio
