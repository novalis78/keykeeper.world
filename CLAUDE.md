never push .env or .env.local files
never drop tables
git add,commit, push often for incremental checkpoints

## Deployment

Trigger Coolify deployment directly (no need for empty commits):
```bash
curl -X GET "http://107.170.27.222:8000/api/v1/deploy?uuid=qkg4okk4wk084g0cgs4g8co8&force=false" \
  -H "Authorization: Bearer 2|KiZcwJEyw2hap35PNde1yQllC49O3u6OTaWWbhkMb5026341"
```

Coolify dashboard: http://107.170.27.222:8000
Docs: https://coolify.io/docs/api-reference/api/operations/deploy-by-tag-or-uuid

## Environment

This machine runs:
- MySQL database (local)
- Postfix/Dovecot mail server
- Coolify deployment system
- The keykeeper.world codebase