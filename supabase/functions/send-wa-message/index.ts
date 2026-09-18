import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WA_ACCESS_TOKEN_ENV = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || "";
const WA_PHONE_ID_ENV = Deno.env.get('WHATSAPP_PHONE_ID') || "";
const API_VERSION = "v21.0";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { to, templateName, languageCode = "id", components = [], text, token, phoneId } = payload;

    const accessToken = token || WA_ACCESS_TOKEN_ENV;
    const activePhoneId = phoneId || WA_PHONE_ID_ENV;

    if (!accessToken || !activePhoneId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Kredensial WhatsApp API (Token / Phone ID) belum dikonfigurasi di lingkungan server.",
          isConfigError: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: "Nomor tujuan (to) wajib diisi." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Format nomor telepon
    let cleanTo = String(to).replace(/\D/g, "");
    if (cleanTo.startsWith("0")) {
      cleanTo = "62" + cleanTo.substring(1);
    } else if (cleanTo.startsWith("8")) {
      cleanTo = "62" + cleanTo;
    }

    let metaRequestBody: any = {
      messaging_product: "whatsapp",
      to: cleanTo
    };

    if (templateName) {
      metaRequestBody.type = "template";
      metaRequestBody.template = {
        name: templateName,
        language: {
          code: languageCode
        },
        components: components
      };
    } else if (text) {
      metaRequestBody.recipient_type = "individual";
      metaRequestBody.type = "text";
      metaRequestBody.text = { body: text };
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Parameter templateName atau text wajib disertakan." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[send-wa-message] Sending to ${cleanTo} via PhoneId ${activePhoneId}:`, JSON.stringify(metaRequestBody));

    const metaRes = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${activePhoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(metaRequestBody)
      }
    );

    const metaResult = await metaRes.json();
    console.log("[send-wa-message] Meta Response:", JSON.stringify(metaResult));

    if (!metaRes.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: metaResult?.error?.message || "Gagal mengirim pesan WhatsApp via Meta Cloud API",
          details: metaResult
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: metaRes.status }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: metaResult
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("[send-wa-message] Exception:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Internal server error saat memproses pesan WhatsApp"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
