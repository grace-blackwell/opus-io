// This script helps migrate data from the Client model to the Contact model
// Run this after applying the schema changes

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateClientsToContacts() {
  console.log('Starting migration from Client to Contact...');

  try {
    // 1. Get all clients
    const clients = await prisma.client.findMany({
      include: {
        BillingAddress: true,
      },
    });

    console.log(`Found ${clients.length} clients to migrate`);

    // 2. For each client, create a corresponding contact
    for (const client of clients) {
      console.log(`Migrating client: ${client.clientName} (${client.id})`);

      // Create the contact
      const contact = await prisma.contact.create({
        data: {
          id: client.id, // Keep the same ID
          contactName: client.clientName,
          contactEmail: client.clientEmail,
          contactPhone: client.clientPhone,
          contactWebsite: client.clientWebsite,
          accountId: client.accountId,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
        },
      });

      console.log(`Created contact: ${contact.contactName} (${contact.id})`);

      // If the client has a billing address, create one for the contact
      if (client.BillingAddress) {
        const billingAddress = await prisma.billingAddress.create({
          data: {
            id: client.BillingAddress.id,
            street: client.BillingAddress.street,
            city: client.BillingAddress.city,
            state: client.BillingAddress.state,
            zipCode: client.BillingAddress.zipCode,
            country: client.BillingAddress.country,
            createdAt: client.BillingAddress.createdAt,
            updatedAt: client.BillingAddress.updatedAt,
            contactId: contact.id,
          },
        });

        console.log(`Migrated billing address for contact: ${contact.contactName}`);
      }

      // Update all related records to point to the new contact
      // Projects
      await prisma.project.updateMany({
        where: { clientId: client.id },
        data: { contactId: contact.id },
      });

      // Contracts
      await prisma.contract.updateMany({
        where: { clientId: client.id },
        data: { contactId: contact.id },
      });

      // Invoices
      await prisma.invoice.updateMany({
        where: { clientId: client.id },
        data: { contactId: contact.id },
      });

      // Payment History
      await prisma.paymentHistory.updateMany({
        where: { clientId: client.id },
        data: { contactId: contact.id },
      });

      // Tasks
      await prisma.task.updateMany({
        where: { clientId: client.id },
        data: { contactId: contact.id },
      });

      console.log(`Updated all related records for contact: ${contact.contactName}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateClientsToContacts()
  .then(() => console.log('Migration script finished'))
  .catch((e) => console.error('Migration script failed:', e));