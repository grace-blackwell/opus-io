"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { QuillOptions } from "quill";
import type Quill from "quill";
import { useParams, useRouter } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import "./project-editor-styles.css";
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

interface ProjectEditorProps {
  initialContent?: string;
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({
  initialContent = "",
}) => {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [content, setContent] = useState<string>(initialContent);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<Quill | null>(null);

  // Function to save notes to the database
  const saveNotes = useCallback(async () => {
    if (isSaving || !quillInstanceRef.current) return false;

    try {
      setIsSaving(true);
      const notesContent = quillInstanceRef.current.root.innerHTML;

      const response = await fetch(`/api/projects/${projectId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notesContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      // Update the content state with the saved content
      setContent(notesContent);
      toast.success("Notes saved successfully");
      setIsDirty(false);

      // If there was a pending navigation, proceed with it after saving
      if (pendingNavigation) {
        // Use window.location for more reliable navigation
        window.location.href = pendingNavigation;
        setPendingNavigation(null);
      }

      return true; // Indicate successful save
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
      return false; // Indicate failed save
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, projectId, pendingNavigation]);

  // Function to fetch notes from the database
  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}/notes`);

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();
      setContent(data.notes || "");
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Fetch notes when component mounts
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Initialize Quill editor - only once when loading is complete
  useEffect(() => {
    // Skip initialization if we're still loading
    if (isLoading || typeof window === "undefined" || !editorRef.current) {
      return;
    }

    // Clean up any existing toolbars first to prevent duplicates
    const existingToolbars = document.querySelectorAll(".ql-toolbar");
    existingToolbars.forEach((toolbar) => {
      toolbar.remove();
    });

    // Clean up any existing editors
    const existingEditors = document.querySelectorAll(".ql-editor");
    existingEditors.forEach((editor) => {
      const parent = editor.parentNode;
      if (
        parent &&
        parent.parentNode === editorRef.current &&
        parent instanceof Element
      ) {
        parent.remove();
      }
    });

    // Dynamically import Quill only on the client side
    import("quill").then((QuillModule) => {
      // Check if component is still mounted
      if (!editorRef.current) return;

      const quillOptions: QuillOptions = {
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ["bold", "italic", "underline", "strike"],
            ["blockquote", "code-block"],
            ["link", "image", "video", "formula"],
            [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
            [{ script: "sub" }, { script: "super" }], // superscript/subscript
            [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
            [{ direction: "rtl" }],
            [{ color: [] }, { background: [] }], // dropdown with defaults from theme
            [{ font: [] }],
            [{ align: [] }],
            ["clean"], // remove formatting button
          ],
        },
        placeholder: "Start your project notes...",
        theme: "snow",
      };

      // Create new Quill instance
      const quill = new QuillModule.default(editorRef.current, quillOptions);
      quillInstanceRef.current = quill;

      // Set initial content if available
      if (content) {
        quill.clipboard.dangerouslyPasteHTML(content);
      }

      // Add change handler to mark content as dirty
      quill.on("text-change", () => {
        if (!isDirty) {
          setIsDirty(true);
        }
      });
    });

    // Cleanup function when component unmounts
    return () => {
      // Properly clean up
      quillInstanceRef.current = null;
    };
  }, [isLoading, content, isDirty]); // Only re-initialize when loading state changes

  // Update Quill content when content state changes (e.g., after saving)
  useEffect(() => {
    if (!isLoading && quillInstanceRef.current && content) {
      // Only update if the editor is already initialized and not dirty
      if (!isDirty) {
        quillInstanceRef.current.clipboard.dangerouslyPasteHTML(content);
      }
    }
  }, [content, isLoading, isDirty]);

  // We've removed the beforeunload event listener to disable the native browser pop-up
  // The custom dialog will still be shown for internal navigation

  // Custom navigation handler to intercept Next.js navigation
  const handleNavigation = useCallback(
    (url: string) => {
      if (isDirty) {
        // Store the pending navigation and show the dialog
        setPendingNavigation(url);
        setShowUnsavedDialog(true);
        return false; // Prevent navigation
      }
      return true; // Allow navigation
    },
    [isDirty]
  );

  // Patch Next.js router to intercept navigation
  useEffect(() => {
    // Save the original push method
    const originalPush = router.push.bind(router);

    // Override the push method
    const patchedRouter = router as AppRouterInstance;
    patchedRouter.push = (url: string) => {
      if (handleNavigation(url)) {
        // Use window.location for more reliable navigation
        window.location.href = url;
      }
    };

    // Restore the original push method on cleanup
    return () => {
      patchedRouter.push = originalPush;
    };
  }, [router, handleNavigation]);

  // Handle dialog actions
  const handleSaveAndContinue = useCallback(async () => {
    setShowUnsavedDialog(false);
    const saveSuccessful = await saveNotes();

    // If saving failed or couldn't be performed but we still have a pending navigation,
    // we should continue with the navigation anyway
    if (!saveSuccessful && pendingNavigation) {
      // Use window.location for more reliable navigation
      window.location.href = pendingNavigation;
      setPendingNavigation(null);
    }
    // Successful navigation is handled inside saveNotes
  }, [saveNotes, pendingNavigation]);

  const handleDiscardAndContinue = useCallback(() => {
    setIsDirty(false);
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      // Use window.location for more reliable navigation
      window.location.href = pendingNavigation;
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  const handleCancelNavigation = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  }, []);

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px] bg-base-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div>
          <div
            ref={editorRef}
            className="min-h-[200px] bg-base-100 text-base-content quill-editor-container"
          ></div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={saveNotes}
              disabled={isSaving || !isDirty}
              className={`px-4 py-2 rounded-md ${
                isDirty
                  ? "bg-primary text-primary-content hover:bg-primary-focus"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Saving...
                </span>
              ) : (
                "Save Notes"
              )}
            </button>
          </div>

          {/* Unsaved Changes Dialog */}
          <AlertDialog
            open={showUnsavedDialog}
            onOpenChange={setShowUnsavedDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                <AlertDialogDescription>
                  You have unsaved changes in your notes. Would you like to save
                  them before leaving?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCancelNavigation}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDiscardAndContinue}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Discard Changes
                </AlertDialogAction>
                <AlertDialogAction onClick={handleSaveAndContinue}>
                  Save Changes
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default ProjectEditor;
