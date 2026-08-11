const fetch = require('node-fetch');

async function test() {
  const url = 'https://maps.app.goo.gl/EwgAzxRHeyWurtQH7';
  
  // 1. AllOrigins
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const json = await res.json();
    console.log("AllOrigins success:", !!json.contents, json.contents?.length || 0);
  } catch (e) {
    console.log("AllOrigins failed:", e.message);
  }

  // 2. Corsproxy.io
  try {
    const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`);
    const text = await res.text();
    console.log("Corsproxy.io success:", text.length);
  } catch (e) {
    console.log("Corsproxy.io failed:", e.message);
  }

  // 3. Codetabs
  try {
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
    const text = await res.text();
    console.log("Codetabs success:", text.length);
  } catch (e) {
    console.log("Codetabs failed:", e.message);
  }
}

test();
