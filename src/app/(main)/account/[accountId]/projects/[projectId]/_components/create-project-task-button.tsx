"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import { useModal } from "@/providers/modal-provider";
import CustomModal from "@/components/global/custom-modal";
import TaskForm from "@/components/forms/task-form";
import { TaskWithTags } from "@/lib/types";

type Props = {
  laneId: string;
  accountId: string;
  projectId: string;
  addNewTask: (task: TaskWithTags) => void;
};

const CreateProjectTaskButton = ({
  laneId,
  accountId,
  projectId,
  addNewTask,
}: Props) => {
  const { setOpen } = useModal();

  const handleCreateTask = () => {
    setOpen(
      <CustomModal
        title="Create A Project Task"
        subheading="Create a task for this specific project."
      >
        <TaskForm
          getNewTask={addNewTask}
          laneId={laneId}
          accountId={accountId}
          defaultProjectId={projectId}
        />
      </CustomModal>
    );
  };

  return (
    <Button onClick={handleCreateTask} className="flex items-center gap-2">
      <PlusCircleIcon size={15} />
      Create Task
    </Button>
  );
};

export default CreateProjectTaskButton;
