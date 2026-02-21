import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, COIN_PACKS } from "@/lib/stripe";
import { syncSubscription } from "@/services/subscription.service";
import { addCoins } from "@/services/coins.service";
import { supabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import Stripe from "stripe";

// Disable body parsing — Stripe needs raw body
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("[Stripe Webhook] Signature verification failed", { error: message });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ——— Subscription events ———
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription & Record<string, unknown>;
        const userId = sub.metadata.userId;
        if (!userId) break;

        await syncSubscription(
          sub.id,
          sub.status,
          userId,
          sub.items.data[0]?.price.id || "",
          (sub as any).current_period_start,
          (sub as any).current_period_end,
          sub.cancel_at_period_end,
          (sub as any).trial_end,
        );
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription & Record<string, unknown>;
        const userId = sub.metadata.userId;
        if (!userId) break;

        await syncSubscription(
          sub.id,
          "canceled",
          userId,
          sub.items.data[0]?.price.id || "",
          (sub as any).current_period_start,
          (sub as any).current_period_end,
          false,
        );

        // Reset Pro status
        await supabaseAdmin.from("profiles").update({
          is_pro: false,
          pro_expires_at: null,
        }).eq("id", userId);
        break;
      }

      // ——— Payment events ———
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) break;

        // Log payment
        await supabaseAdmin.from("payments").insert({
          user_id: userId,
          stripe_payment_intent_id: session.payment_intent as string,
          amount: session.amount_total || 0,
          currency: session.currency || "eur",
          status: "succeeded",
          type: session.metadata?.type === "coins_purchase" ? "coins_purchase" : "subscription",
          metadata: session.metadata,
        });

        // Handle VeloCoins purchase
        if (session.metadata?.type === "coins_purchase") {
          const coinPackId = session.metadata.coinPackId;
          const pack = COIN_PACKS.find((p) => p.id === coinPackId);
          if (pack) {
            await addCoins(
              userId,
              pack.coins,
              "pack_open", // reuse existing reason
              { source: "stripe", coinPackId, amount: session.amount_total },
              `stripe_coins_${session.id}`, // idempotency
            );
          }
        }
        break;
      }

      // ——— Invoice events (pour tracking) ———
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user from customer
        const { data: customerRecord } = await supabaseAdmin
          .from("stripe_customers")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (customerRecord) {
          await supabaseAdmin.from("payments").insert({
            user_id: customerRecord.user_id,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: "succeeded",
            type: "subscription",
            metadata: { invoiceUrl: invoice.hosted_invoice_url },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: customerRecord } = await supabaseAdmin
          .from("stripe_customers")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (customerRecord) {
          await supabaseAdmin.from("payments").insert({
            user_id: customerRecord.user_id,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: "failed",
            type: "subscription",
          });
        }
        break;
      }

      default:
        // Event non géré
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    logger.error("[Stripe Webhook] Error", { error: String(error) });
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
