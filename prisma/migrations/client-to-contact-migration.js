// This script helps update references after the database schema has been modified
// It assumes that the SQL migration has already been run and the Contact table exists
// with data copied from the Client table

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateContactReferences() {
  console.log('Starting update of contact references...');

  try {
    // Get all contacts
    const contacts = await prisma.contact.findMany();
    console.log(`Found ${contacts.length} contacts to process`);

    // For each contact, update the Tags relationship
    for (const contact of contacts) {
      console.log(`Processing contact: ${contact.contactName} (${contact.id})`);

      // Get tags for this account
      const accountTags = await prisma.tag.findMany({
        where: { accountId: contact.accountId }
      });

      if (accountTags.length > 0) {
        // Randomly assign 1-3 tags to each contact for demonstration
        const tagsToAssign = accountTags
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 3) + 1);

        if (tagsToAssign.length > 0) {
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              Tags: {
                connect: tagsToAssign.map(tag => ({ id: tag.id }))
              }
            }
          });

          console.log(`Assigned ${tagsToAssign.length} tags to contact: ${contact.contactName}`);
        }
      }
    }

    console.log('Contact references updated successfully!');
  } catch (error) {
    console.error('Error during update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateContactReferences()
  .then(() => console.log('Update script finished'))
  .catch((e) => console.error('Update script failed:', e));