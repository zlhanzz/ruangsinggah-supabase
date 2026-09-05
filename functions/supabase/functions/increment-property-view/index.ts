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

    const { propertyId, viewerUid } = await req.json();

    if (!propertyId) {
      return new Response(JSON.stringify({ error: "Missing propertyId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Ambil metadata properti
    const { data: prop, error: fetchError } = await supabaseClient
      .from("properties")
      .select("id, owner_uid, metadata")
      .eq("id", propertyId)
      .maybeSingle();

    if (fetchError || !prop) {
      return new Response(JSON.stringify({ error: fetchError?.message || "Property not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Abaikan jika yang melihat adalah pemilik properti
    if (viewerUid && prop.owner_uid === viewerUid) {
      return new Response(JSON.stringify({ success: true, message: "Owner view ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const meta = typeof prop.metadata === "object" && prop.metadata !== null ? { ...prop.metadata } : {};
    const dailyViews = typeof meta.daily_views === "object" && meta.daily_views !== null ? { ...meta.daily_views } : {};

    dailyViews[todayStr] = Number(dailyViews[todayStr] || 0) + 1;

    // Bersihkan data tanggal yang lebih dari 60 hari lalu
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const cutoffStr = sixtyDaysAgo.toISOString().split("T")[0];
    for (const dKey of Object.keys(dailyViews)) {
      if (dKey < cutoffStr) delete dailyViews[dKey];
    }

    const totalViews = Number(meta.views || 0) + 1;
    meta.views = totalViews;
    meta.daily_views = dailyViews;

    // 2. Simpan metadata
    const { error: updateError } = await supabaseClient
      .from("properties")
      .update({ metadata: meta, updated_at: new Date().toISOString() })
      .eq("id", propertyId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, views: totalViews, dailyViews }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
