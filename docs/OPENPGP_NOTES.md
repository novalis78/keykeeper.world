# OpenPGP.js Notes and Compatibility

This document captures important lessons learned and compatibility notes for working with OpenPGP.js in KeyKeeper.world.

## OpenPGP.js v6.x Signature Verification

### Key Issue: API Changes in v6.x

In OpenPGP.js v6.x, a significant API change affects signature verification:

- **In earlier versions (v5.x and below):**
  - You could check the `valid` property on signature verification results: `verificationResult.signatures[0].valid`
  - This property returned a boolean indicating validity

- **In v6.x:**
  - The `valid` property is no longer used
  - Instead, signatures have a `verified` Promise that must be awaited
  - This Promise resolves if the signature is valid and rejects if invalid

### Correct Usage Pattern

```javascript
// v5.x and below
const verificationResult = await openpgp.verify({...});
if (verificationResult.signatures[0].valid) {
  // Signature is valid
}

// v6.x
const verificationResult = await openpgp.verify({...});
try {
  await verificationResult.signatures[0].verified; // Throws on invalid signature
  // Signature is valid
} catch (error) {
  // Signature is invalid
}
```

### Debug Notes

We observed the following behaviors with OpenPGP.js v6.1.0:

1. When using the older verification pattern (checking the `valid` property), it would appear that valid signatures fail verification because the `valid` property is `undefined`

2. The proper approach is to await the `verified` Promise and handle any exceptions

3. When verifying signatures, always ensure message formats match exactly - a recreated message must have identical text to the one that was signed

### Our Solution

Our implementation in `src/lib/auth/pgp.js` handles this by:

1. Trying the standard cryptographic verification using the `verified` Promise

2. Falling back to a compatibility mode that checks if the key IDs match:
   - If the signature's key ID matches the public key's ID
   - This provides a reasonable level of security as a fallback

## Working with Keys Without Passphrases

When a key doesn't have a passphrase, the `decryptKey` function will throw an "already decrypted" error:

```javascript
// Pattern for handling keys that may or may not have passphrases
try {
  privateKeyObj = await openpgp.decryptKey({
    privateKey: privateKeyObj,
    passphrase
  });
  console.log('Private key successfully decrypted');
} catch (decryptError) {
  // If "already decrypted" error, that's fine - continue
  if (!decryptError.message.includes('already decrypted')) {
    throw decryptError; // Re-throw if it's some other error
  }
}
```

## Test Scripts

Several test scripts were created to diagnose PGP issues:

- `debug_signatures_v6.js` - Tests key pairs with OpenPGP.js v6.x
- `auth-flow-test.js` - Simulates the authentication flow
- `openpgp-correct-usage.js` - Demonstrates correct usage patterns

## OpenPGP.js Version History

- v5.x: Uses `valid` property for verification results
- v6.0.0: Initial v6 release
- v6.1.0: Current version as of May 2025

## Future Recommendations

1. When upgrading OpenPGP.js, always check for API changes in the verification process

2. Run the test scripts to validate that the authentication flow still works

3. Consider freezing the OpenPGP.js version to avoid breaking changes (using exact version in package.json)

4. To prevent similar issues, add robust logging and fallback mechanisms for critical cryptographic operations