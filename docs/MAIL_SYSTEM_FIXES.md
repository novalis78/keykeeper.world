# Mail System Fixes and Improvements

## Completed Fixes

### 1. Database Connection Issues

The primary issue was a "No database selected" error when retrieving mail accounts. We implemented the following fixes in `src/lib/users/passwordManager.js`:

- Added robust error handling throughout the mail account retrieval process
- Implemented fallback to main database connection when getMailDbConnection fails
- Added explicit database name extraction from DATABASE_URL environment variable
- Modified queries to use fully qualified table names (database.table)
- Added alternative query formats for different user_id formats (case-insensitive, without dashes)
- Added diagnostic logging to better identify issues

### 2. Mail Account Diagnostics

Added several diagnostic tools to help troubleshoot mail-related issues:

- Created web API endpoints for mail system diagnostics
- Added detailed logging for connection establishment and query execution
- Implemented test tools to verify database connections and mail account retrieval

## Recommended Improvements

Based on the code review, here are additional improvements that should be implemented:

### 1. Harmonize Database Connection Approach

Currently there are multiple implementations of `getMailDbConnection()` across different files:
- In `src/lib/db.js`
- In `src/lib/mail/accountManager.js` 
- In `src/lib/users/passwordManager.js`

**Recommendation:** Refactor to use a single implementation to reduce redundancy and potential inconsistencies.

### 2. Better Environment Configuration

The codebase uses multiple environment variables that control similar behaviors:
- `USE_MAIN_DB_FOR_MAIL`
- `MAIL_DB_HOST`, `MAIL_DB_USER`, `MAIL_DB_PASSWORD`, `MAIL_DB_NAME`
- `DATABASE_URL` vs individual connection parameters

**Recommendation:** Create a simplified configuration approach with clear documentation.

### 3. Standardize Error Handling

Different parts of the code handle database errors differently:
- Some return empty arrays
- Some throw exceptions
- Some return null

**Recommendation:** Implement a consistent error handling strategy for database operations.

### 4. Add System Health Checks

**Recommendation:** Implement a health check system that can verify:
- Database connections (both main and mail DB)
- Mail server connectivity (SMTP/IMAP)
- Mail account presence and correct linking

### 5. Update Documentation

The `docs/MAILBOX.md` file should be updated with:
- Clear explanation of the configuration options
- Troubleshooting steps based on recent fixes
- Clarification on how the mail system integrates with the application

### 6. Enhance Client-Side Credential Management

As outlined in the development plan, implement client-side credential storage:
- Complete the PGP-based password derivation system
- Implement secure client-side credential storage
- Update the UI to support this workflow

## Long-term Architecture Improvements

### 1. Unify Database Schema

Consider merging mail accounts directly into the main database schema to simplify operations.

### 2. Implement Connection Pooling

For mail database connections to improve performance and reliability.

### 3. Add Monitoring

Implement performance monitoring for mail operations to proactively identify issues.

## Implementation Plan

1. Apply the remaining recommended fixes one by one, starting with harmonizing the database connection approach
2. Update documentation as each improvement is completed
3. Implement the client-side credential management system as outlined in the development plan
4. Add comprehensive testing for mail system functionality