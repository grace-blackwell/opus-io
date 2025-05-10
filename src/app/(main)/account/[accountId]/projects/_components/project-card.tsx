"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandItem } from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import DeleteButton from "./delete-button";

type ProjectStatus = "NotStarted" | "InProgress" | "Completed";

type Contact = {
  id: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  contactWebsite: string | null;
} | null;

type Invoice = {
  id: string;
  invoiceNumber: bigint;
  invoiceDate: Date;
  dueDate: Date;
  paymentStatus: string;
  currency: string;
  unitType: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  salesTaxRate: number | null;
  salesTaxAmount: number | null;
  totalDue: number;
  taxId: string | null;
  createdAt: Date;
  updatedAt: Date;
  contractId: string;
  contactId: string;
  accountId: string;
  projectId: string;
};

type Contract = {
  id: string;
  contractTitle: string;
  dateOfAgreement: Date;
  expirationDate: Date;
  status: string;
  contractType: string;
  scopeOfWork: string;
  paymentTerms: string;
  paymentMethod: string;
  paymentFrequency: string;
  confidentialityAgreement: boolean;
  terminationClause: boolean;
  clientSignature: boolean | null;
  clientSignatureDate: Date | null;
  freelancerSignature: boolean | null;
  freelancerSignatureDate: Date | null;
  amendmentClause: boolean;
  revisions: number;
  createdAt: Date;
  updatedAt: Date;
  contactId: string;
  projectId: string;
  accountId: string;
} | null;

type Account = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  connectAccoutId: string | null;
  customerId: string;
  accountName: string;
  accountPhone: string;
  accountEmail: string;
  connectedAccountId: string | null;
  title: string;
  logo: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

type Project = {
  id: string;
  description: string | null;
  projectTitle: string;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  contactId: string | null;
  Contact: Contact;
  accountId: string;
  estimatedHours: number | null;
  actualHours: number | null;
  estimatedCost: number | null;
  actualCost: number | null;
  status: ProjectStatus;
  contractId: string | null;
  Contract: Contract | null;
  invoices: Invoice[];
  Account: Account;
  isTracking: boolean;
  trackedStartTime: Date | null;
  totalTrackedTime: number;
};

type ProjectCardProps = {
  project: Project;
  accountId: string;
};

const ProjectCard = ({ project, accountId }: ProjectCardProps) => {
  return (
    <CommandItem
      key={project.id}
      className="max-w-4xl h-20 !bg-background my-2 text-primary border-[1px] border-border p-4 hover:!bg-background cursor-pointer transition-all"
    >
      <Link
        href={`/account/${accountId}/projects/${project.id}`}
        className="flex gap-4 w-full h-full"
      >
        <div className="flex flex-col justify-between w-full">
          <div className="flex justify-between w-full">
            <div className="flex flex-col">
              <span className="font-bold">{project.projectTitle}</span>
              <span className="text-xs">
                {project.Contact ? project.Contact.contactName : "No Client"}
              </span>
            </div>
            <Badge
              className={`${
                project.status === "NotStarted"
                  ? "bg-gray-500"
                  : project.status === "InProgress"
                  ? "bg-blue-500"
                  : "bg-green-500"
              } text-white mt-2`}
            >
              {project.status === "NotStarted"
                ? "Not Started"
                : project.status === "InProgress"
                ? "In Progress"
                : "Completed"}
            </Badge>
          </div>
        </div>
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="destructive"
            className="text-red-600 bg-white w-20 hover:bg-red-600 hover:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-left">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              This action cannot be undone. This will permanently delete the
              project and all related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive">
              <DeleteButton
                projectId={project.id}
                projectTitle={project.projectTitle}
              />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CommandItem>
  );
};

export default ProjectCard;
