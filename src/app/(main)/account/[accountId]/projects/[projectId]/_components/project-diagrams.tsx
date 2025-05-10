"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, FileSymlink, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Diagram } from "@prisma/client";
import { createDiagram, deleteDiagram, updateDiagram } from "@/lib/queries";
import { toast } from "sonner";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  diagrams: Diagram[];
  accountId: string;
  projectId: string;
};

const ProjectDiagrams = ({ diagrams, accountId, projectId }: Props) => {
  const router = useRouter();
  const [diagramsList, setDiagramsList] = useState<Diagram[]>(diagrams);

  useEffect(() => {
    setDiagramsList(diagrams);
  }, [diagrams]);

  const handleCreateDiagram = async () => {
    try {
      // Create a new diagram with a default name and empty content
      const emptyDiagramXml =
        '<?xml version="1.0" encoding="UTF-8"?><mxfile host="app.diagrams.net" modified="2023-01-01T00:00:00.000Z" agent="Mozilla/5.0" etag="1234" version="21.2.8" type="device"><diagram id="diagram" name="Page-1"><mxGraphModel dx="1050" dy="629" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>';

      const newDiagram = await createDiagram(accountId, projectId, {
        name: "New Diagram",
        content: emptyDiagramXml,
      });

      // Open draw.io with a blank diagram
      // Using the simplest approach that should work reliably
      const callbackUrl = `${window.location.origin}/api/diagrams/${newDiagram.id}`;

      // Open a new blank diagram and set the save URL
      // Using specific parameters to ensure proper saving
      const url = `https://app.diagrams.net/?mode=browser&title=New Diagram&saveAndExit=1&spin=1&libraries=1&saveTarget=self&target=self&modified=unsavedChanges&saveFormat=xml&format=xml&save=${encodeURIComponent(
        callbackUrl
      )}`;
      window.open(url, "_blank");

      toast.success("Creating new diagram. Opening draw.io editor...");
    } catch (error) {
      console.error("Error creating diagram:", error);
      toast.error("Failed to create diagram");
    }
  };

  const handleEditDiagram = (diagram: Diagram) => {
    // Open draw.io in a new tab with the diagram content
    const callbackUrl = `${window.location.origin}/api/diagrams/${diagram.id}`;

    // Using specific parameters to ensure proper loading and saving
    const url = `https://app.diagrams.net/?mode=browser&title=${encodeURIComponent(
      diagram.name
    )}&url=${encodeURIComponent(
      callbackUrl
    )}&saveAndExit=1&spin=1&libraries=1&saveTarget=self&target=self&modified=unsavedChanges&saveFormat=xml&format=xml&save=${encodeURIComponent(
      callbackUrl
    )}`;
    window.open(url, "_blank");

    toast.info(`Opening "${diagram.name}" in draw.io editor...`);
  };

  const handleDeleteDiagram = async (diagramId: string) => {
    try {
      await deleteDiagram(diagramId);
      toast.success("Diagram deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Error deleting diagram:", error);
      toast.error("Failed to delete diagram");
    }
  };

  const handleOpenDiagram = (diagram: Diagram) => {
    // Open draw.io in a new tab with the diagram content
    const callbackUrl = `${window.location.origin}/api/diagrams/${diagram.id}`;

    // Using specific parameters to ensure proper loading and saving
    const url = `https://app.diagrams.net/?mode=browser&title=${encodeURIComponent(
      diagram.name
    )}&url=${encodeURIComponent(
      callbackUrl
    )}&saveAndExit=1&spin=1&libraries=1&saveTarget=self&target=self&modified=unsavedChanges&saveFormat=xml&format=xml&save=${encodeURIComponent(
      callbackUrl
    )}`;
    window.open(url, "_blank");

    toast.info(`Opening "${diagram.name}" in draw.io editor...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Diagrams</h2>
        <Button onClick={handleCreateDiagram}>
          <Plus className="mr-2 h-4 w-4" />
          Create Diagram
        </Button>
      </div>

      {diagramsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <FileSymlink className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No diagrams yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first diagram to visualize your project structure or
            workflow.
          </p>
          <Button onClick={handleCreateDiagram} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Diagram
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diagramsList.map((diagram) => (
            <Card key={diagram.id} className="overflow-hidden">
              <div
                className="relative h-40 cursor-pointer"
                onClick={() => handleOpenDiagram(diagram)}
              >
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  {diagram.thumbnail ? (
                    <Image
                      src={diagram.thumbnail}
                      alt={diagram.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <FileSymlink className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
              </div>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">{diagram.name}</CardTitle>
                <CardDescription>
                  Last updated:{" "}
                  {format(new Date(diagram.updatedAt), "MMM dd, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditDiagram(diagram)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteDiagram(diagram.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface CreateDiagramFormProps {
  accountId: string;
  projectId: string;
  onSuccess: (diagramId: string) => void;
}

const CreateDiagramForm = ({
  accountId,
  projectId,
  onSuccess,
}: CreateDiagramFormProps) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newDiagram = await createDiagram(accountId, projectId, {
        name,
        content:
          '<?xml version="1.0" encoding="UTF-8"?><mxfile host="Electron" modified="2023-01-01T00:00:00.000Z" agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) draw.io/21.2.8 Chrome/112.0.5615.165 Electron/24.2.0 Safari/537.36" etag="1234" version="21.2.8" type="device"><diagram id="diagram" name="Page-1"><mxGraphModel dx="1050" dy="629" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>',
      });
      toast.success("Diagram created successfully");
      onSuccess(newDiagram.id);
    } catch (error) {
      console.error("Error creating diagram:", error);
      toast.error("Failed to create diagram");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Diagram Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter diagram name"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Diagram"}
      </Button>
    </form>
  );
};

interface EditDiagramFormProps {
  diagram: Diagram;
  onSuccess: (diagramId: string) => void;
}

const EditDiagramForm = ({ diagram, onSuccess }: EditDiagramFormProps) => {
  const [name, setName] = useState(diagram.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateDiagram(diagram.id, { name });
      toast.success("Diagram updated successfully");
      onSuccess(diagram.id);
    } catch (error) {
      console.error("Error updating diagram:", error);
      toast.error("Failed to update diagram");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Diagram Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter diagram name"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Diagram"}
      </Button>
    </form>
  );
};

export { CreateDiagramForm, EditDiagramForm };
export default ProjectDiagrams;
