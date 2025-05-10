"use client";

import { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

// This is a workaround for React 18 Strict Mode and drag-and-drop
// Note: @hello-pangea/dnd is a maintained fork of react-beautiful-dnd with React 18 fixes

// Monkey patching to ensure consistent behavior
const patchDndForReact18 = () => {
  // Fix for React 18 Strict Mode
  const originalGetBoundingClientRect =
    HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    const rect = originalGetBoundingClientRect.call(this);
    if (rect.x === 0 && rect.y === 0 && this.id.includes("rbd")) {
      // For DND elements that have 0,0 position, use their parent's position
      if (this.parentElement) {
        const parentRect = this.parentElement.getBoundingClientRect();
        return new DOMRect(parentRect.x, parentRect.y, rect.width, rect.height);
      }
    }
    return rect;
  };
};

export const useDndFix = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only apply the patch in the browser
    if (typeof window !== "undefined") {
      patchDndForReact18();
      setIsReady(true);
    }
  }, []);

  return isReady;
};

// Re-export components and types with the fix applied
export { DragDropContext, Droppable, Draggable, type DropResult };
