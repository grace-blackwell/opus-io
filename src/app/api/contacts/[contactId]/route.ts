import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const { contactId } = params;

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    const contact = await db.contact.findUnique({
      where: { id: contactId },
      include: {
        Tags: true,
        BillingAddress: true,
        projects: true
      }
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const { contactId } = params;

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // First, delete the billing address if it exists
    const billingAddress = await db.billingAddress.findFirst({
      where: {
        contactId: contactId
      }
    });

    if (billingAddress) {
      await db.billingAddress.delete({
        where: {
          id: billingAddress.id
        }
      });
    }

    // Then delete the contact
    const deletedContact = await db.contact.delete({
      where: {
        id: contactId
      }
    });

    return NextResponse.json(deletedContact);
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}