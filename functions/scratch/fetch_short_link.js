const fetch = require('node-fetch');

async function test() {
  const shortUrl = 'https://maps.app.goo.gl/EwgAzxRHeyWurtQH7';
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(shortUrl)}`;
  const res = await fetch(proxyUrl);
  const data = await res.json();
  const html = data.contents;
  
  console.log("HTML length:", html.length);
  // Write html to a file to inspect
  const fs = require('fs');
  fs.writeFileSync('functions/scratch/short_link_page.html', html, 'utf8');
  console.log("Written to functions/scratch/short_link_page.html");
}

test();
