import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { customerId, priceId } = await req.json();
  if (!customerId || !priceId)
    return new NextResponse("Customer ID or Price ID is missing.", {
      status: 400,
    });

  const subscriptionExists = await db.account.findFirst({
    where: {
      customerId,
    },
    include: {
      Subscription: true,
    },
  });

  try {
    if (
      subscriptionExists?.Subscription?.subscriptionId &&
      subscriptionExists.Subscription.active
    ) {
      //update subscription instead of creating one.
      if (!subscriptionExists.Subscription.subscriptionId) {
        throw new Error(
          "Couldn't find the subscription ID to update subscription."
        );
      }
      console.log("Updating existing subscription");
      const currentSubscriptionDetails = await stripe.subscriptions.retrieve(
        subscriptionExists.Subscription.subscriptionId
      );

      const subscription = await stripe.subscriptions.update(
        subscriptionExists.Subscription.subscriptionId,
        {
          items: [
            { id: currentSubscriptionDetails.items.data[0].id, deleted: true },
            { price: priceId },
          ],
          expand: ["latest_invoice.payment_intent"],
        }
      );

      return NextResponse.json({
        subscriptionId: subscription.id,
        //@ts-expect-error - Stripe types don't properly expose latest_invoice.payment_intent
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      });
    } else {
      console.log("Creating a new subscription");
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });
      return NextResponse.json({
        subscriptionId: subscription.id,
        //@ts-expect-error - Stripe types don't properly expose latest_invoice.payment_intent
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      });
    }
  } catch (error) {
    console.log("Error ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
