const { google } = require('googleapis');

function testKey(rawPrivateKey) {
  if (rawPrivateKey.trim().startsWith('{')) {
    try {
      const jsonKey = JSON.parse(rawPrivateKey);
      if (jsonKey.private_key) {
        rawPrivateKey = jsonKey.private_key;
      }
    } catch (e) {
    }
  }

  const privateKey = rawPrivateKey
    .replace(/\\n/g, '\n')
    .replace(/\n/g, '\n')
    .replace(/"/g, '')
    .trim();
    
  console.log('Processed Key:', JSON.stringify(privateKey));
  
  try {
    const auth = new google.auth.JWT({
      email: 'test@example.com',
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    // Just instantiate, we don't need to actually connect
    console.log('Auth instantiated. Trying to sign a token to force key parsing...');
    
    // In googleapis, the key is parsed when it tries to sign a JWT or authorize.
    // Let's manually trigger crypto to parse it
    const crypto = require('crypto');
    crypto.createSign('RSA-SHA256').sign(privateKey, 'base64');
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// Generate a valid mock PEM key for testing parsing
const crypto = require('crypto');
const { privateKey: mockKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

console.log('--- Original Mock Key ---');
console.log(JSON.stringify(mockKey));

console.log('\n--- Case 1: Plain PEM ---');
testKey(mockKey);

console.log('\n--- Case 2: Escaped PEM \\n ---');
testKey(mockKey.replace(/\n/g, '\\n'));

console.log('\n--- Case 3: JSON Object String ---');
testKey(JSON.stringify({ private_key: mockKey }));

console.log('\n--- Case 4: Literal " around string ---');
testKey(`"${mockKey.replace(/\n/g, '\\n')}"`);

console.log('\n--- Case 5: Real Bad Format (No headers) ---');
testKey('MIIEvgIBA...');
