const fetch = require('node-fetch');

async function test() {
  const url = 'https://maps.app.goo.gl/EwgAzxRHeyWurtQH7';
  const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
  const text = await res.text();
  console.log("Length:", text.length);
  console.log("First 300 chars:", text.slice(0, 300));
  console.log("Contains coordinates?", text.includes('-5.1'));
  
  // Look for coordinates
  const regex = /(-?\d+\.\d+)\s*(?:,|%2C|%2c)\s*(119\.\d+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    console.log("Match:", match[0]);
  }
}

test();
