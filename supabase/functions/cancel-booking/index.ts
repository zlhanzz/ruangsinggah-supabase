import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { transactionId, sessionId, residentStatusId, action = "cancel" } = await req.json();

    if (!transactionId && !sessionId) {
      throw new Error("Missing transactionId or sessionId");
    }

    const newStatus = action === "expire" ? "EXPIRED" : "CANCELLED";
    const nowIso = new Date().toISOString();

    // 1. Update target transaction by ID
    if (transactionId) {
      const { error: updateError } = await supabaseClient
        .from("transactions")
        .update({ 
          status: newStatus,
          updated_at: nowIso
        })
        .eq("id", transactionId);

      if (updateError) console.warn("Error updating main transaction:", updateError);

      // Update child transactions (e.g. parent_order_id)
      await supabaseClient
        .from("transactions")
        .update({ 
          status: newStatus,
          updated_at: nowIso
        })
        .filter("metadata->>parent_order_id", "eq", transactionId);
    }

    // 2. Update by booking_session_id if provided
    if (sessionId) {
      await supabaseClient
        .from("transactions")
        .update({ 
          status: newStatus,
          updated_at: nowIso
        })
        .filter("metadata->>booking_session_id", "eq", sessionId);
    }

    // 3. Update resident_status if provided or linked
    if (residentStatusId) {
      await supabaseClient
        .from("resident_status")
        .update({ 
          status: newStatus,
          updated_at: nowIso 
        })
        .eq("id", residentStatusId);
    } else if (transactionId) {
      // Find linked resident_status
      const { data: linkedRes } = await supabaseClient
        .from("resident_status")
        .select("id")
        .or(`last_transaction_id.eq.${transactionId},id.eq.${transactionId}`)
        .maybeSingle();

      if (linkedRes?.id) {
        await supabaseClient
          .from("resident_status")
          .update({ 
            status: newStatus,
            updated_at: nowIso 
          })
          .eq("id", linkedRes.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Booking ${newStatus.toLowerCase()} successfully`,
        status: newStatus
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
