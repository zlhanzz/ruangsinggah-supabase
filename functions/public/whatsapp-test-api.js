const fetch = require('node-fetch'); // Assuming node-fetch or Node 18+ environment

const WHATSAPP_ACCESS_TOKEN = 'EAALJZBHqz36sBRBFc41yxK10ZCQTazinzCEZBGFZC4XyETqSh4uyqSyKsMAxpiYwwrrp48GIPTZBLBVflqZB03d6yfOL6ULrVihEEk22JgmDZBoqIlVaB7LrW0Wvm4z33ZBVjdRzB87pioK3knLWeJagd0bFXJZC4cr5cmWVgjSS4YOr00eMAb6cLw7F0AZClgWOiWze6l8gwTZBLDNCxZBhkwD40wTT6aZAKtM27EcMSZChjGwJkcZBYeAh1IJoyPu6eJMDpB6OEd5JZCzDwSVkM4uiglZAxYlPJ';
const PHONE_NUMBER_ID = '1132009059986709';
const API_VERSION = 'v21.0';
const TO = '6281527080656';

async function testSend() {
  console.log('Mengirim pesan WhatsApp ke:', TO);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: TO,
          type: 'template',
          template: {
            name: 'hello_world',
            language: {
              code: 'en_US'
            }
          }
        })
      }
    );

    const result = await response.json();
    console.log('Status Response:', response.status);
    console.log('Hasil:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ BERHASIL! Silakan cek WhatsApp Anda.');
    } else {
      console.log('\n❌ GAGAL. Pastikan nomor tujuan sudah Anda daftarkan sebagai "Recipient" di portal Meta.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testSend();
