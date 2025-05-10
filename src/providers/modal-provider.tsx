"use client";

import { Contact, Account, User, Project } from "@prisma/client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  TaskDetails,
  InvoicesWithAccountContactContractProject,
} from "@/lib/types";

interface ModalProviderProps {
  children: React.ReactNode;
}

export type ModalData = {
  contact?: Contact;
  account?: Account;
  user?: User;
  task?: TaskDetails;
  project?: Project;
  invoice?: InvoicesWithAccountContactContractProject;
  // plans?: {
  //     defaultPriceId: Plan;
  //     plans: PricesList['data'];
  // }
};

type ModalContextType = {
  data: ModalData;
  isOpen: boolean;
  setOpen: (
    modal: React.ReactNode,
    fetchData?: () => Promise<Partial<ModalData>>
  ) => void;
  setClose: () => void;
};

export const ModalContext = createContext<ModalContextType>({
  data: {},
  isOpen: false,
  setOpen:
    (/* modal: React.ReactNode, fetchData?: () => Promise<Partial<ModalData>> */) => {},
  setClose: () => {},
});

const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ModalData>({});
  const [showingModal, setShowingModal] = useState<React.ReactNode>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Use useCallback to prevent unnecessary re-renders
  const setOpen = useCallback(
    async (
      modal: React.ReactNode,
      fetchData?: () => Promise<Partial<ModalData>>
    ) => {
      if (modal) {
        if (fetchData) {
          try {
            const fetchedData = await fetchData();
            setData((prevData) => ({ ...prevData, ...fetchedData }));
          } catch (error) {
            console.error("Error fetching data for modal:", error);
          }
        }
        setShowingModal(modal);
        setIsOpen(true);
      }
    },
    []
  );

  const setClose = useCallback(() => {
    setIsOpen(false);
    // Don't immediately clear data and modal to allow for exit animations
    setTimeout(() => {
      setData({});
      setShowingModal(null);
    }, 300); // Match this with your animation duration
  }, []);

  if (!isMounted) return null;

  return (
    <ModalContext.Provider value={{ data, isOpen, setOpen, setClose }}>
      {children}
      {showingModal}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export default ModalProvider;
