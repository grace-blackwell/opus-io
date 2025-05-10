"use client";

import React, { useState } from "react";
import { Diagram } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  diagram: Diagram;
  accountId: string;
  projectId: string;
};

const DiagramEditor = ({ diagram, accountId, projectId }: Props) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Function to handle iframe load event
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleBack = () => {
    router.push(`/account/${accountId}/projects/${projectId}?tab=diagrams`);
  };

  // Create a simple URL with the diagram content in the hash
  const encodedDiagram = encodeURIComponent(diagram.content);
  const editorUrl = `https://embed.diagrams.net/?embed=1&spin=1&ui=kennedy&saveAndExit=1&noExitBtn=0&modified=unsavedChanges#${encodedDiagram}`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 border-b">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>
        <h1 className="text-xl font-bold">{diagram.name}</h1>
        <div className="text-sm text-muted-foreground">
          Click &quot;Save&quot; in the editor to save your changes
        </div>
      </div>
      <div className="flex-grow relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        <iframe
          src={editorUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          title="Diagram Editor"
          className="w-full h-full"
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
};

export default DiagramEditor;
