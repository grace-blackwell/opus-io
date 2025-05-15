import React from "react";
import { getAuthUserDetails } from "@/lib/queries";
import { db } from "@/lib/db";
import DataTable from "@/app/(main)/account/[accountId]/invoices/data-table";
import { columns } from "@/app/(main)/account/[accountId]/invoices/columns";
import InvoiceDetails from "@/components/forms/invoice-details";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { InvoicesWithAccountContactContractProject } from "@/lib/types";

type Props = {
  params: { accountId: string };
};

const InvoicesPage = async ({ params }: Props) => {
  const parameters = await params;
  const user = await getAuthUserDetails();
  if (!user || !user.Account) return null;

  const invoices = await db.invoice.findMany({
    where: {
      accountId: parameters.accountId,
    },
    include: {
      Account: true,
      Contact: {
        include: {
          BillingAddress: true,
        },
      },
      Project: true,
    },
  });

  const accountDetails = await db.account.findUnique({
    where: {
      id: parameters.accountId,
    },
  });

  if (!accountDetails) return null;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-4 mb-6">
        <Link href={`/account/${parameters.accountId}/invoice-generator`}>
          <Button variant="default" className="flex gap-2">
            <FileText size={16} />
            Invoice Generator
          </Button>
        </Link>
      </div>
      <DataTable<InvoicesWithAccountContactContractProject, unknown>
        columns={columns}
        data={invoices}
        filterValue="invoiceNumber"
        modalChildren={<InvoiceDetails accountId={parameters.accountId} />}
      />
    </div>
  );
};

export default InvoicesPage;
