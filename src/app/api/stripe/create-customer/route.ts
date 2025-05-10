import { stripe } from "@/lib/stripe";
import { StripeCustomerType } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { address, email, name, shipping }: StripeCustomerType =
    await req.json();

  if (!email || !name || !address || !shipping)
    return new NextResponse("Missing Data", { status: 400 });

  try {
    const customer = await stripe.customers.create({
      address,
      email,
      name,
      shipping,
    });
    return Response.json({ customerId: customer.id });
  } catch (error) {
    console.log("Error ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
