"use client";

import { Project } from "@prisma/client";
import ProjectTimeTracker from "@/components/time-tracker/project-time-tracker";
import { useRouter } from "next/navigation";

interface ProjectTimeTrackerWrapperProps {
  project: Project;
}

export default function ProjectTimeTrackerWrapper({
  project,
}: ProjectTimeTrackerWrapperProps) {
  const router = useRouter();

  const handleTimeUpdate = () => {
    // Refresh the page to show updated time tracking data
    router.refresh();
  };

  return (
    <ProjectTimeTracker project={project} onTimeUpdate={handleTimeUpdate} />
  );
}
