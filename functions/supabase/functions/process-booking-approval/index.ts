import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAKASIR_SLUG = "ruangsinggah-id";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { transactionId, decision, reason } = await req.json();

    if (!transactionId || !decision) {
      throw new Error("Missing transactionId or decision");
    }

    // 1. Fetch Transaction & User details
    const { data: transaction, error: fetchError } = await supabaseClient
      .from("transactions")
      .select(`
        *,
        user:user_id (
          name,
          phone
        )
      `)
      .eq("id", transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new Error(fetchError?.message || "Transaction not found");
    }

    const newStatus = decision === "accept" ? "AWAITING_PAYMENT" : "REJECTED";
    const amount = transaction.amount;
    const userName = transaction.user?.name || "Penyewa";
    const userPhone = transaction.user?.phone || "";
    const itemName = transaction.metadata?.kostName || transaction.metadata?.item || "Kost";

    // 2. Update Transaction Status
    const updates: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
    };

    let paymentLink = null;
    let whatsappUrl = null;

    if (decision === "accept") {
        // Construct Pakasir Checkout URL
        paymentLink = `https://app.pakasir.com/pay/${PAKASIR_SLUG}/${amount}?order_id=${transactionId}`;
        updates.pakasir_link = paymentLink;
        
        // Prepare WhatsApp message
        const waMsg = `Halo ${userName}, pengajuan sewa Anda untuk *${itemName}* telah disetujui! ✅\n\nSilakan selesaikan pembayaran Anda melalui tautan berikut:\n${paymentLink}\n\nTerima kasih.`;
        whatsappUrl = `https://wa.me/${userPhone}?text=${encodeURIComponent(waMsg)}`;
    } else {
        // Prepare rejection message
        const waMsg = `Halo ${userName}, mohon maaf pengajuan sewa Anda untuk *${itemName}* belum dapat kami setujui saat ini. ❌${reason ? `\n\nAlasan: ${reason}` : ""}\n\nTerima kasih atas pengertiannya.`;
        whatsappUrl = `https://wa.me/${userPhone}?text=${encodeURIComponent(waMsg)}`;
    }

    const { error: updateError } = await supabaseClient
      .from("transactions")
      .update(updates)
      .eq("id", transactionId);

    if (updateError) throw updateError;

    // 3. Create In-App Notification
    await supabaseClient
      .from("notifications")
      .insert([{
        user_id: transaction.user_id,
        title: decision === "accept" ? "Pengajuan Disetujui!" : "Pengajuan Ditolak",
        message: decision === "accept" 
          ? `Pengajuan sewa ${itemName} telah disetujui. Silakan lakukan pembayaran.`
          : `Mohon maaf, pengajuan sewa ${itemName} Anda ditolak.`,
        type: "rental",
        link: "/my-bookings"
      }]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Booking ${decision}ed successfully`, 
        status: newStatus,
        paymentLink,
        whatsappUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
