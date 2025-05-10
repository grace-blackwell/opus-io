"use client";

import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, DropResult } from "@/lib/dnd-fix";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/providers/modal-provider";
import CustomModal from "@/components/global/custom-modal";
import { CreateLaneForm } from "@/components/forms/create-lane";
import { PiKanbanLight } from "react-icons/pi";
import KanbanLane from "@/app/(main)/account/[accountId]/kanbans/_components/kanban-lane";
import { LaneDetail, TaskAndTags } from "@/lib/types";
import { Lane, Task } from "@prisma/client";
import { useRouter } from "next/navigation";

type Props = {
  lanes: LaneDetail[];
  kanbanId: string;
  accountId: string;
  projectId: string;
  updateLanesOrder: (lanes: Lane[]) => Promise<void>;
  updateTasksOrder: (tasks: Task[]) => Promise<void>;
};

const ProjectKanban = ({
  lanes,
  kanbanId,
  accountId,
  projectId,
  updateLanesOrder,
  updateTasksOrder,
}: Props) => {
  const { setOpen } = useModal();
  const router = useRouter();
  const [allLanes, setAllLanes] = React.useState<LaneDetail[]>([]);

  useEffect(() => {
    setAllLanes(lanes);
  }, [lanes]);

  // Filter tasks to only include those related to this project
  const filterTasksByProject = (tasks: TaskAndTags[]): TaskAndTags[] => {
    return tasks.filter((task) => task.projectId === projectId);
  };

  // Get all tasks from all lanes that belong to this project
  const tasksFromAllLanes: TaskAndTags[] = [];
  lanes.forEach((item) => {
    const projectTasks = filterTasksByProject(item.Tasks);
    projectTasks.forEach((i) => {
      tasksFromAllLanes.push(i);
    });
  });

  const [allTasks, setAllTasks] = useState(tasksFromAllLanes);

  const handleDragEnd = (results: DropResult) => {
    const { destination, source, type } = results;
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    switch (type) {
      case "lane": {
        if (!allLanes) return;
        const newLanes = [...allLanes]
          .toSpliced(source.index, 1)
          .toSpliced(destination.index, 0, allLanes[source.index])
          .map((lane, index) => {
            return {
              ...lane,
              order: index,
            };
          });

        setAllLanes(newLanes);
        updateLanesOrder(newLanes);
        break;
      }

      case "task": {
        if (!allLanes) return;
        const newLanes = [...allLanes];
        const originLane = newLanes.find(
          (lane) => lane.id === source.droppableId
        );

        const destinationLane = newLanes.find(
          (lane) => lane.id === destination.droppableId
        );

        if (!originLane || !destinationLane) {
          return;
        }

        // Filter tasks to only include project-specific tasks
        const originProjectTasks = filterTasksByProject(originLane.Tasks);

        if (source.droppableId === destination.droppableId) {
          const newOrderedTasks = [...originProjectTasks]
            .toSpliced(source.index, 1)
            .toSpliced(destination.index, 0, originProjectTasks[source.index])
            .map((item, idx) => {
              return { ...item, order: idx };
            });

          // Update only the project tasks in the original lane
          const updatedLaneTasks = originLane.Tasks.map((task) => {
            const matchingTask = newOrderedTasks.find((t) => t.id === task.id);
            return matchingTask || task;
          });

          originLane.Tasks = updatedLaneTasks;
          setAllLanes(newLanes);
          updateTasksOrder(newOrderedTasks);
          router.refresh();
        } else {
          const destinationProjectTasks = filterTasksByProject(
            destinationLane.Tasks
          );

          // Get the task to move
          const [currentTask] = originProjectTasks.splice(source.index, 1);

          // Update orders for remaining tasks in origin lane
          originProjectTasks.forEach((task, idx) => {
            task.order = idx;
          });

          // Insert task into destination lane
          destinationProjectTasks.splice(destination.index, 0, {
            ...currentTask,
            laneId: destination.droppableId,
          });

          // Update orders for destination lane tasks
          destinationProjectTasks.forEach((task, idx) => {
            task.order = idx;
          });

          // Update the lanes with the modified tasks
          const updatedOriginLaneTasks = originLane.Tasks.filter(
            (task) => task.id !== currentTask.id
          );
          originLane.Tasks = updatedOriginLaneTasks;

          const updatedDestinationLaneTasks = [
            ...destinationLane.Tasks,
            { ...currentTask, laneId: destination.droppableId },
          ];
          destinationLane.Tasks = updatedDestinationLaneTasks;

          setAllLanes(newLanes);
          updateTasksOrder([...destinationProjectTasks, ...originProjectTasks]);
          router.refresh();
        }
        break;
      }
    }
  };

  const handleAddLane = () => {
    setOpen(
      <CustomModal
        title={"Create a Lane"}
        subheading={
          "Lanes allow you to group tasks together by type or priority."
        }
      >
        <CreateLaneForm kanbanId={kanbanId} />
      </CustomModal>
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={"rounded-xl p-4 use-automation-zoom-in"}>
        <div className={"flex items-center justify-between"}>
          <h1 className={"text-xl"}>Project Tasks</h1>
          <Button className={"flex items-center gap-4"} onClick={handleAddLane}>
            <Plus size={15} />
            Create Lane
          </Button>
        </div>
        <Droppable
          droppableId={"lanes"}
          type={"lane"}
          direction={"horizontal"}
          key={"lanes"}
        >
          {(provided) => (
            <div
              className={"flex item-center gap-x-2 overflow-visible"}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              <div className={"flex mt-4"}>
                {allLanes.map((lane, index) => {
                  // Filter tasks for this project
                  const projectTasks = filterTasksByProject(lane.Tasks);

                  // Only render lanes that have tasks for this project
                  return (
                    <KanbanLane
                      key={lane.id}
                      setAllTasks={setAllTasks}
                      allTasks={allTasks}
                      tasks={projectTasks}
                      kanbanId={kanbanId}
                      laneDetail={{ ...lane, Tasks: projectTasks }}
                      accountId={accountId}
                      index={index}
                      projectId={projectId}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
        {allLanes.length === 0 || tasksFromAllLanes.length === 0 ? (
          <div className={"flex items-center justify-center w-full flex-col"}>
            <div className={"opacity-100"}>
              <PiKanbanLight size={200} className={"text-muted-foreground"} />
            </div>
            <p className="text-muted-foreground mt-4">
              {allLanes.length === 0
                ? "No lanes available. Create a lane to get started."
                : "No tasks for this project yet. Create a task to get started."}
            </p>
          </div>
        ) : null}
      </div>
    </DragDropContext>
  );
};

export default ProjectKanban;
