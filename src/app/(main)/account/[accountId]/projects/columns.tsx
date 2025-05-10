"use client";

import ProjectDetails from "@/components/forms/project-details";
import CustomModal from "@/components/global/custom-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { deleteProject, getProject } from "@/lib/queries";
import { ProjectsWithAccountContactContracts } from "@/lib/types";
import { useModal } from "@/providers/modal-provider";
import { ColumnDef } from "@tanstack/react-table";
import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Invoice, Project } from "@prisma/client";

export const columns: ColumnDef<ProjectsWithAccountContactContracts>[] = [
  {
    accessorKey: "id",
    header: "",
    cell: () => {
      return null;
    },
  },
  {
    accessorKey: "projectTitle",
    header: "Title",
    cell: ({ row }) => {
      const projectTitle = row.getValue("projectTitle") as string;
      return (
        <div className="flex items-center gap-4">
          <span>{projectTitle}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Creation Date",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date;
      // Format the date to a string
      const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString()
        : "";
      return (
        <div className="flex items-center gap-4">
          <span>{formattedDate}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="flex items-center gap-4">
          <span>{status}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "Contact",
    header: "Contact",
    cell: ({ row }) => {
      const contactName = row.original?.Contact?.contactName;
      return (
        <div className="flex items-center gap-4">
          <span>{contactName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "Contract",
    header: "Contract",
    cell: ({ row }) => {
      const contractTitle = row.original?.Contract?.contractTitle;
      return (
        <div className="flex items-center gap-4">
          {row.original?.Contract ? (
            <Badge className="bg-slate-600 whitespace-nowrap">
              {contractTitle}
            </Badge>
          ) : (
            "No Contract"
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "invoices",
    header: "Invoices",
    cell: ({ row }) => {
      const invoices = row.getValue("invoices") as Invoice[];
      return (
        <div className="flex flex-col items-start">
          <div className="flex flex-col gap-2">
            {invoices?.length
              ? invoices.map((invoice) => (
                  <Badge
                    key={invoice.id}
                    className="bg-slate-600 w-fit whitespace-nowrap"
                  >
                    {invoice.invoiceNumber} - ${invoice.totalDue.toFixed(2)}
                  </Badge>
                ))
              : "No invoices yet"}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "estimatedHours",
    header: "Estimated Hours",
    cell: ({ row }) => {
      const estimatedHours = row.getValue("estimatedHours") as string;
      return (
        <div className="flex items-center gap-4">
          <span color="blue">{estimatedHours}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "estimatedCost",
    header: "Estimated Cost",
    cell: ({ row }) => {
      const estimatedCost = row.getValue("estimatedCost") as string;
      return (
        <div className="flex items-center gap-4">
          <span color="blue">{estimatedCost}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "actualHours",
    header: "Actual Hours",
    cell: ({ row }) => {
      const actualHours = row.getValue("actualHours") as string;
      return (
        <div className="flex items-center gap-4">
          <span color="green">{actualHours}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "actualCost",
    header: "Actual Cost",
    cell: ({ row }) => {
      const actualCost = row.getValue("actualCost") as string;
      return (
        <div className="flex items-center gap-4">
          <span color="green">{actualCost}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const rowData = row.original;

      return <CellActions rowData={rowData} />;
    },
  },
];

interface CellActionsProps {
  rowData: ProjectsWithAccountContactContracts;
}

const CellActions: React.FC<CellActionsProps> = ({ rowData }) => {
  const { setOpen } = useModal();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  if (!rowData) return;
  if (!rowData.Account) return;
  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <Edit size={15} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => {
              setOpen(
                <CustomModal
                  subheading="Enter project details"
                  title="Edit Project Details"
                >
                  <ProjectDetails
                    accountId={rowData?.Account?.id || null}
                    contactId={rowData.Contact?.id || null}
                    contractId={rowData.Contract?.id || null}
                    projects={rowData}
                  />
                </CustomModal>,
                async () => {
                  const projectData = await getProject(rowData?.id);
                  // Type assertion to match the Project type expected by ModalData
                  return {
                    project: projectData as unknown as Project,
                  };
                }
              );
            }}
          >
            Edit Project Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            Are you sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            This action cannot be undone. This will permanently delete the
            project and related data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex items-center">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className="bg-destructive hover:bg-destructive"
            onClick={async () => {
              setLoading(true);
              await deleteProject(rowData.id);
              toast.success("Project deleted successfully", {
                description: `The project "${rowData.projectTitle}" has been deleted.`,
              });
              setLoading(false);
              router.refresh();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
