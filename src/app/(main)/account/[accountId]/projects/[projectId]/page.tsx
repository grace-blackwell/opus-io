import React from "react";
import { db } from "@/lib/db";
import {
  getAuthUserDetails,
  getLanesWithTasksAndTags,
  updateLanesOrder,
  updateTasksOrder,
} from "@/lib/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit,
  GanttChart,
  Kanban,
  List,
  FileSymlink,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import EditProjectModal from "./_components/edit-project-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectKanban from "./_components/project-kanban";
import { LaneDetail } from "@/lib/types";
import ProjectTimeTrackerWrapper from "./_components/project-time-tracker-wrapper";
import ProjectTimeEntries from "./_components/project-time-entries";
import ProjectGanttChart from "./_components/project-gantt-chart";
import ProjectEditor from "./_components/project-editor";

type Props = {
  params: {
    accountId: string;
    projectId: string;
  };
  searchParams: {
    tab?: string;
  };
};

const ProjectDetailsPage = async ({ params, searchParams }: Props) => {
  const parameters = await params;
  const searchParameters = await searchParams;
  const user = await getAuthUserDetails();
  if (!user || !user.Account) return null;

  const project = await db.project.findUnique({
    where: {
      id: parameters.projectId,
      accountId: parameters.accountId,
    },
    include: {
      Account: true,
      Contact: true,
      Contract: true,
      invoices: true,
    },
  });

  if (!project)
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Project not found</h1>
        <p className="text-muted-foreground">
          The project you are looking for does not exist or you do not have
          access to it.
        </p>
        <Link href={`/account/${parameters.accountId}/projects`}>
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );

  // Get the first kanban board for the account
  const kanban = await db.kanban.findFirst({
    where: {
      accountId: parameters.accountId,
    },
  });

  // If no kanban exists, create one
  const kanbanId = kanban
    ? kanban.id
    : (
        await db.kanban.create({
          data: {
            name: "Project Kanban",
            accountId: parameters.accountId,
          },
        })
      ).id;

  // Get lanes with tasks and tags
  const lanes = (await getLanesWithTasksAndTags(kanbanId)) as LaneDetail[];

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <Link href={`/account/${parameters.accountId}/projects`}>
          <Button variant="default">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>

        <Link href={`?modal=edit-project`} prefetch={false}>
          <Button className={"bg-secondary"}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={searchParameters.tab || "details"} className="w-full">
        <TabsList className="mb-4 rounded-none bg-background">
          <TabsTrigger value="details">
            {" "}
            <List className={"text-primary"} /> Project Details
          </TabsTrigger>
          <TabsTrigger value="tasks">
            {" "}
            <Kanban className={"text-primary"} /> Project Tasks
          </TabsTrigger>
          <TabsTrigger value="timeline">
            {" "}
            <GanttChart className={"text-primary"} /> Timeline
          </TabsTrigger>
          <TabsTrigger value="diagrams">
            {" "}
            <FileSymlink className={"text-primary"} /> Diagrams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <Card className={"border-none rounded-none"}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl">
                        {project.projectTitle}
                      </CardTitle>
                      <CardDescription>
                        {project.Contact?.contactName || "No Client Assigned"} •
                        Created on{" "}
                        {format(new Date(project.createdAt), "MMM dd, yyyy")}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${
                        project.status === "NotStarted"
                          ? "bg-gray-500"
                          : project.status === "InProgress"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      } text-white`}
                    >
                      {project.status === "NotStarted"
                        ? "Not Started"
                        : project.status === "InProgress"
                        ? "In Progress"
                        : "Completed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Description</h3>
                    <p className="mt-2">
                      {project.description || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium">Estimated Hours</h3>
                      <p className="mt-2">
                        {project.estimatedHours || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Actual Hours</h3>
                      <p className="mt-2">
                        {project.actualHours || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Estimated Cost</h3>
                      <p className="mt-2">
                        {project.estimatedCost
                          ? new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(project.estimatedCost)
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Actual Cost</h3>
                      <p className="mt-2">
                        {project.actualCost
                          ? new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(project.actualCost)
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  {project.invoices.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium">Invoices</h3>
                      <div className="mt-2 space-y-2">
                        {project.invoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="flex justify-between items-center p-3 border"
                          >
                            <div>
                              <p className="font-medium">
                                Invoice #{invoice.invoiceNumber.toString()}
                              </p>
                              <p className="text-sm">
                                Due:{" "}
                                {format(
                                  new Date(invoice.dueDate),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge
                                className={`${
                                  invoice.paymentStatus === "Paid"
                                    ? "bg-success"
                                    : invoice.paymentStatus === "Overdue"
                                    ? "bg-error"
                                    : "bg-warning"
                                } text-white`}
                              >
                                {invoice.paymentStatus}
                              </Badge>
                              <p className="font-medium">
                                {new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: invoice.currency,
                                }).format(invoice.totalDue)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={"border-none rounded-none"}>
                <CardHeader>
                  <CardTitle>Project Notes</CardTitle>
                  <CardDescription>
                    Add and edit notes for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProjectEditor />
                </CardContent>
              </Card>
            </div>
            <div className="col-span-1 space-y-6">
              <ProjectTimeTrackerWrapper project={project} />

              <Card className={"border-none rounded-none"}>
                <CardHeader>
                  <CardTitle>Time Entries</CardTitle>
                  <CardDescription>
                    Recent time entries for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProjectTimeEntries projectId={parameters.projectId} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className={"border-none rounded-none"}>
            <CardContent className="pt-6">
              <ProjectKanban
                lanes={lanes}
                kanbanId={kanbanId}
                accountId={parameters.accountId}
                projectId={parameters.projectId}
                updateLanesOrder={updateLanesOrder}
                updateTasksOrder={updateTasksOrder}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className={"border-none rounded-none"}>
            <CardContent className="pt-4">
              <ProjectGanttChart projectId={parameters.projectId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagrams">
          <Card className={"border-none rounded-none"}>
            <CardContent className="pt-4"></CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Project Modal */}
      <EditProjectModal accountId={parameters.accountId} project={project} />
    </div>
  );
};

export default ProjectDetailsPage;
