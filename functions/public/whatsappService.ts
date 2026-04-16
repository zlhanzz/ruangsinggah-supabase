const WHATSAPP_ACCESS_TOKEN = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = import.meta.env.VITE_WHATSAPP_PHONE_ID;
const API_VERSION = 'v21.0';

/**
 * Interface untuk pengiriman pesan WhatsApp
 */
export interface SendWhatsAppParams {
  to: string; // Nomor telepon penerima (format 628xxx)
  templateName: string;
  languageCode?: string;
  components?: any[];
}

/**
 * Mengirim pesan WhatsApp menggunakan Template Meta Cloud API
 */
export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'en_US',
  components = []
}: SendWhatsAppParams) {
  if (!WHATSAPP_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error('WhatsApp API credentials are missing in .env.local');
    return { success: false, error: 'Missing credentials' };
  }

  // Bersihkan nomor telepon (hanya angka)
  let cleanTo = to.replace(/\D/g, '');
  if (cleanTo.startsWith('0')) {
    cleanTo = '62' + cleanTo.substring(1);
  }

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
          to: cleanTo,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode
            },
            components: components
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API Error:', result);
      return { success: false, error: result };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('WhatsApp Service Exception:', error);
    return { success: false, error };
  }
}

/**
 * Mengirim pesan teks biasa (Hanya bisa dikirim jika session chat sudah terbuka)
 */
export async function sendWhatsAppText(to: string, message: string) {
  let cleanTo = to.replace(/\D/g, '');
  if (cleanTo.startsWith('0')) {
    cleanTo = '62' + cleanTo.substring(1);
  }

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
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: { body: message }
        })
      }
    );

    const result = await response.json();
    return { success: response.ok, data: result };
  } catch (error) {
    return { success: false, error };
  }
}

const whatsappService = {
  sendWhatsAppTemplate,
  sendWhatsAppText
};

export default whatsappService;
