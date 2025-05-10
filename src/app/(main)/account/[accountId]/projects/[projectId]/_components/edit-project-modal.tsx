"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CustomModal from "@/components/global/custom-modal";
import ProjectDetails from "@/components/forms/project-details";
import { useModal } from "@/providers/modal-provider";

import { ProjectsWithAccountContactContracts } from "@/lib/types";

type Props = {
  accountId: string;
  project: ProjectsWithAccountContactContracts;
};

const EditProjectModal = ({ accountId, project }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setOpen, setClose } = useModal();
  const showModal = searchParams.get("modal") === "edit-project";
  const hasInitialized = useRef(false);

  // Set up the modal when the URL parameter is present
  useEffect(() => {
    // Only run this effect once per modal open state to prevent infinite loops
    if (showModal && !hasInitialized.current) {
      hasInitialized.current = true;

      setOpen(
        <CustomModal
          title="Edit Project"
          subheading="Update project details"
          onClose={() => {
            router.push(`/account/${accountId}/projects/${project.id}`);
          }}
        >
          <ProjectDetails
            accountId={accountId}
            contactId={project.Contact?.id || null}
            contractId={project.Contract?.id || null}
            projects={project}
          />
        </CustomModal>,
        async () => {
          return { project: project };
        }
      );

      // Clean up function
      return () => {
        // Reset the initialization flag when the component unmounts
        // or when showModal changes to false
        if (!showModal) {
          hasInitialized.current = false;
        }
      };
    }

    // If modal is closed via URL change, make sure to close the modal
    if (!showModal && hasInitialized.current) {
      setClose();
      hasInitialized.current = false;
    }
  }, [showModal, accountId, project, setOpen, setClose, router]);

  // This component doesn't render anything directly
  return null;
};

export default EditProjectModal;
