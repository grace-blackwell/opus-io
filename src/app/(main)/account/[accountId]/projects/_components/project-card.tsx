'use client'

import React from 'react'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandItem } from "@/components/ui/command";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import DeleteButton from "./delete-button";

type ProjectCardProps = {
    project: any;
    accountId: string;
}

const ProjectCard = ({ project, accountId }: ProjectCardProps) => {
    return (
        <CommandItem 
            key={project.id} 
            className="max-w-3xl h-20 !bg-background my-2 text-primary border-[1px] border-border p-4 hover:!bg-background cursor-pointer transition-all"
        >
            <Link href={`/account/${accountId}/projects/${project.id}`} className="flex gap-4 w-full h-full">
                <div className="flex flex-col justify-between w-full">
                    <div className="flex justify-between w-full">
                        <div className="flex flex-col">
                            <span className="font-medium">{project.projectTitle}</span>
                            <span className="text-foreground text-xs">
                                {project.Contact?.contactName || 'No Client'}
                            </span>
                        </div>
                        <Badge
                            className={`${
                                project.status === 'NotStarted' 
                                    ? 'bg-gray-500' 
                                    : project.status === 'InProgress' 
                                    ? 'bg-blue-500' 
                                    : 'bg-green-500'
                            } text-white mt-2`}
                        >
                            {project.status === 'NotStarted' 
                                ? 'Not Started' 
                                : project.status === 'InProgress' 
                                ? 'In Progress' 
                                : 'Completed'}
                        </Badge>
                    </div>
                </div>
            </Link>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button 
                        size="sm" 
                        variant="destructive" 
                        className="text-red-600 bg-white w-20 hover:bg-red-600 hover:text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Delete
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-left">
                            Are you sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left">
                            This action cannot be undone. This will permanently delete the project and all related data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex items-center">
                        <AlertDialogCancel>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive">
                            <DeleteButton projectId={project.id} projectTitle={project.projectTitle} />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CommandItem>
    )
}

export default ProjectCard