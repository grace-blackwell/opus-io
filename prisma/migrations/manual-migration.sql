-- Manual migration script to rename Client to Contact
-- This script should be run by a database user with the necessary permissions

-- Create the new Contact table
CREATE TABLE "Contact" (
  "id" TEXT NOT NULL,
  "contactName" TEXT NOT NULL DEFAULT '',
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "contactWebsite" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "accountId" TEXT NOT NULL,
  
  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Contact table
CREATE INDEX "Contact_accountId_idx" ON "Contact"("accountId");
CREATE UNIQUE INDEX "Contact_contactEmail_key" ON "Contact"("contactEmail");

-- Create the many-to-many relationship between Contact and Tag
CREATE TABLE "_ContactToTag" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

-- Create indexes for the junction table
CREATE UNIQUE INDEX "_ContactToTag_AB_unique" ON "_ContactToTag"("A", "B");
CREATE INDEX "_ContactToTag_B_index" ON "_ContactToTag"("B");

-- Add foreign key constraints
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "_ContactToTag" ADD CONSTRAINT "_ContactToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ContactToTag" ADD CONSTRAINT "_ContactToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Modify BillingAddress to reference Contact instead of Client
ALTER TABLE "BillingAddress" RENAME COLUMN "clientId" TO "contactId";
ALTER TABLE "BillingAddress" DROP CONSTRAINT IF EXISTS "BillingAddress_clientId_fkey";
ALTER TABLE "BillingAddress" ADD CONSTRAINT "BillingAddress_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX IF EXISTS "BillingAddress_clientId_idx";
CREATE INDEX "BillingAddress_contactId_idx" ON "BillingAddress"("contactId");
DROP INDEX IF EXISTS "BillingAddress_clientId_key";
CREATE UNIQUE INDEX "BillingAddress_contactId_key" ON "BillingAddress"("contactId");

-- Modify PaymentHistory to reference Contact instead of Client
ALTER TABLE "PaymentHistory" RENAME COLUMN "clientId" TO "contactId";
ALTER TABLE "PaymentHistory" DROP CONSTRAINT IF EXISTS "PaymentHistory_clientId_fkey";
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX IF EXISTS "PaymentHistory_clientId_idx";
CREATE INDEX "PaymentHistory_contactId_idx" ON "PaymentHistory"("contactId");

-- Modify Contract to reference Contact instead of Client
ALTER TABLE "Contract" RENAME COLUMN "clientId" TO "contactId";
ALTER TABLE "Contract" DROP CONSTRAINT IF EXISTS "Contract_clientId_fkey";
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX IF EXISTS "Contract_clientId_idx";
CREATE INDEX "Contract_contactId_idx" ON "Contract"("contactId");

-- Modify ContractAmendment to reference Contact instead of Client
ALTER TABLE "ContractAmendment" RENAME COLUMN "clientId" TO "contactId";

-- Modify Invoice to reference Contact instead of Client
ALTER TABLE "Invoice" RENAME COLUMN "clientId" TO "contactId";
ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_clientId_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX IF EXISTS "Invoice_clientId_idx";
CREATE INDEX "Invoice_contactId_idx" ON "Invoice"("contactId");

-- Modify Project to reference Contact instead of Client
ALTER TABLE "Project" RENAME COLUMN "clientId" TO "contactId";
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_clientId_fkey";
ALTER TABLE "Project" ADD CONSTRAINT "Project_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
DROP INDEX IF EXISTS "Project_clientId_idx";
CREATE INDEX "Project_contactId_idx" ON "Project"("contactId");

-- Modify Task to reference Contact instead of Client
ALTER TABLE "Task" RENAME COLUMN "clientId" TO "contactId";
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_clientId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
DROP INDEX IF EXISTS "Task_clientId_idx";
CREATE INDEX "Task_contactId_idx" ON "Task"("contactId");

-- Data migration: Copy data from Client to Contact
INSERT INTO "Contact" ("id", "contactName", "contactEmail", "contactPhone", "contactWebsite", "createdAt", "updatedAt", "accountId")
SELECT "id", "clientName", "clientEmail", "clientPhone", "clientWebsite", "createdAt", "updatedAt", "accountId"
FROM "Client";

-- After verifying that all data has been migrated correctly, you can drop the Client table
-- DROP TABLE "Client";