import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const WEBHOOK_TOKEN = "q7ia6ax7raf";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    // Validate webhook token
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || req.headers.get("x-webhook-token");
    if (token !== WEBHOOK_TOKEN) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const payload = await req.json();
    const eventType = payload.order_status || payload.event || "unknown";
    const customerEmail = payload.Customer?.email || payload.customer?.email || null;
    const customerName = payload.Customer?.full_name || payload.customer?.name || null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Log the webhook event
    await supabase.from("webhook_logs").insert({
      event_type: eventType,
      customer_email: customerEmail,
      customer_name: customerName,
      payload,
    });

    // Process subscription events
    if (customerEmail) {
      // Find user by email
      const { data: authData } = await supabase.auth.admin.listUsers();
      const user = authData?.users?.find((u: any) => u.email === customerEmail);

      if (user) {
        const statusMap: Record<string, string> = {
          paid: "active",
          approved: "active",
          refunded: "refunded",
          chargedback: "chargedback",
          waiting_payment: "pending",
          overdue: "pending",
          canceled: "canceled",
          expired: "expired",
          renewed: "active",
        };

        const newStatus = statusMap[eventType] || null;
        if (newStatus) {
          await supabase
            .from("user_subscriptions")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
