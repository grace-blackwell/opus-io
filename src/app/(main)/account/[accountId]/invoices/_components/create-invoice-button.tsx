"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/providers/modal-provider";
import CustomModal from "@/components/global/custom-modal";
import InvoiceDetails from "@/components/forms/invoice-details";
import { AuthUserWithSidebarOptions } from "@/lib/types";
import { Plus } from "lucide-react";

type Props = {
  user: AuthUserWithSidebarOptions;
  className?: string;
};

const CreateInvoiceButton = ({ user, className }: Props) => {
  const { setOpen } = useModal();

  const handleCreateInvoice = () => {
    if (!user?.Account?.id) return;

    setOpen(
      <CustomModal
        title="Create New Invoice"
        subheading="Add a new invoice to your account"
      >
        <InvoiceDetails accountId={user.Account.id} />
      </CustomModal>
    );
  };

  return (
    <Button onClick={handleCreateInvoice} className={className}>
      <Plus size={15} className="mr-2" />
      Add Invoice
    </Button>
  );
};

export default CreateInvoiceButton;
