const https = require('https');

const data = JSON.stringify({
  messaging_product: 'whatsapp',
  to: '6281527080656',
  type: 'template',
  template: {
    name: 'hello_world',
    language: {
      code: 'en_US'
    }
  }
});

const options = {
  hostname: 'graph.facebook.com',
  port: 443,
  path: '/v21.0/1132009059986709/messages',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer EAALJZBHqz36sBRBFc41yxK10ZCQTazinzCEZBGFZC4XyETqSh4uyqSyKsMAxpiYwwrrp48GIPTZBLBVflqZB03d6yfOL6ULrVihEEk22JgmDZBoqIlVaB7LrW0Wvm4z33ZBVjdRzB87pioK3knLWeJagd0bFXJZC4cr5cmWVgjSS4YOr00eMAb6cLw7F0AZClgWOiWze6l8gwTZBLDNCxZBhkwD40wTT6aZAKtM27EcMSZChjGwJkcZBYeAh1IJoyPu6eJMDpB6OEd5JZCzDwSVkM4uiglZAxYlPJ',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Mengirim request WhatsApp ke Meta Cloud API...');

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Raw Response:', body);
    
    if (res.statusCode === 200) {
      console.log('\n✅ BERHASIL! Pesan hello_world telah dikirim.');
    } else {
      console.log('\n❌ GAGAL. Cek pesan error di atas.');
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(data);
req.end();
