import React from 'react'
import { db } from "@/lib/db";
import { getAuthUserDetails } from "@/lib/queries";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@/components/ui/command";
import { AlertDialog } from "@/components/ui/alert-dialog";
import ProjectCard from "./_components/project-card";
import AddProjectButton from "./_components/add-project-button";

type Props = {
    params: { accountId: string }
}

const ProjectsPage = async ({ params }: Props) => {
    const parameters = await params
    const user = await getAuthUserDetails();
    if (!user || !user.Account) return null;

    const projects = await db.project.findMany({
        where: {
            accountId: parameters.accountId
        },
        include: {
            Account: true,
            Contact: true,
            Contract: true,
            invoices: true
        }
    });

    const accountDetails = await db.account.findUnique({
        where: {
            id: parameters.accountId
        }
    });

    if (!accountDetails) return null;

    return (
        <AlertDialog>
            <div className="flex flex-col">
                <AddProjectButton accountId={parameters.accountId} className="w-[200px] mb-6" />
                <Command className="bg-transparent w-full">
                    <CommandInput placeholder="Search Projects..." className="" />
                    <CommandList>
                        <CommandEmpty>No projects found.</CommandEmpty>
                        <CommandGroup heading="Projects">
                            {projects.length > 0 ? (
                                projects.map((project) => (
                                    <ProjectCard 
                                        key={project.id}
                                        project={project}
                                        accountId={parameters.accountId}
                                    />
                                ))
                            ) : (
                                <div className="text-muted-foreground text-center p-4">
                                    No Projects
                                </div>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </div>
        </AlertDialog>
    );
};

export default ProjectsPage