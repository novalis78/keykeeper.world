// debug_signatures.js
const fs = require('fs');
const openpgp = require('openpgp');

async function debugSignature() {
  console.log('======= PGP Signature Debug Tool =======');

  try {
    // Generate a test key pair for control testing
    console.log('Generating test key pair...');
    const { privateKey: testPrivateKeyArmored, publicKey: testPublicKeyArmored } = await openpgp.generateKey({
      type: 'ecc',
      curve: 'curve25519',
      userIDs: [{ name: 'Test User', email: 'test@example.com' }],
      format: 'armored'
    });

    console.log('Test key pair generated successfully');

    // Load user private key from disk
    const userPrivateKeyPath = '/home/llopin/Downloads/keykeeper_lennart_private (8).asc';
    console.log(`Reading user private key from: ${userPrivateKeyPath}`);
    const userPrivateKeyArmored = fs.readFileSync(userPrivateKeyPath, 'utf8');

    // Parse and decrypt all keys
    const testPrivateKey = await openpgp.readPrivateKey({ armoredKey: testPrivateKeyArmored });
    await testPrivateKey.decrypt('');  // Unlock the test private key
    const testPublicKey = await openpgp.readKey({ armoredKey: testPublicKeyArmored });

    const userPrivateKey = await openpgp.readPrivateKey({ armoredKey: userPrivateKeyArmored });
    await userPrivateKey.decrypt('');  // 🔐 Important fix: unlock the private key (even if no passphrase)
    const userPublicKey = userPrivateKey.toPublic();

    console.log('Keys loaded and decrypted');
    console.log('Test Key ID:', testPublicKey.getKeyID().toHex());
    console.log('User Key ID:', userPublicKey.getKeyID().toHex());

    // Prepare test messages
    const testChallenge = 'Test challenge message 123';
    const userChallenge = 'keykeeper-auth-2025-05-06T20:21:27.022Z-c1b9627e71d9f7d5d1347fb9211cb3662eeefd1122d8d7c6827d0777ae9b1fcc';

    // === CONTROL TEST ===
    console.log('\nRunning control test (internal key)...');
    const testMessage = await openpgp.createMessage({ text: testChallenge });

    const testSignature = await openpgp.sign({
      message: testMessage,
      signingKeys: testPrivateKey,
      detached: true
    });

    const testVerification = await openpgp.verify({
      message: testMessage,
      signature: await openpgp.readSignature({ armoredSignature: testSignature }),
      verificationKeys: testPublicKey
    });

    const testValid = testVerification.signatures[0].valid;
    console.log('Control Test:', testValid ? '✅ VALID' : '❌ INVALID');

    // === USER TEST ===
    console.log('\nRunning user key test...');
    const userMessage = await openpgp.createMessage({ text: userChallenge });

    const userSignature = await openpgp.sign({
      message: userMessage,
      signingKeys: userPrivateKey,
      detached: true
    });

    fs.writeFileSync('user_signature.asc', userSignature);
    console.log('Signature saved to user_signature.asc');

    const signatureObj = await openpgp.readSignature({ armoredSignature: userSignature });

    const userVerification = await openpgp.verify({
      message: userMessage,
      signature: signatureObj,
      verificationKeys: userPublicKey
    });

    const userValid = userVerification.signatures[0].valid;
    console.log('User Key Test:', userValid ? '✅ VALID' : '❌ INVALID');

    // === SUMMARY ===
    console.log('\n======= SUMMARY =======');
    console.log('Control Signature:', testValid ? '✅ PASSED' : '❌ FAILED');
    console.log('User Signature:   ', userValid ? '✅ PASSED' : '❌ FAILED');

    if (!userValid) {
      console.warn('\n⚠️ WARNING: User key test failed. Check if the private key is fully valid, unlocked, and supports signing.');
    }

  } catch (err) {
    console.error('❌ ERROR during test:', err.message || err);
  }
}

debugSignature();
