import {Prisma, Notification, Lane, Task, Contact, Tag, Project} from "@prisma/client"
import {getAuthUserDetails, getKanbanDetails, getMedia} from "@/lib/queries";
import {db} from "@/lib/db";
import {z} from "zod";
import Stripe from "stripe";

export type NotificationWithUser =
    | ({
        User: {
            id: string
            accountId: string
            email: string
            firstName: string
            lastName: string
            avatarUrl: string
            createdAt: Date
            updatedAt: Date
        }
    } & Notification)[]
    | undefined;

const __getProjectsWithAccountContactContracts = async (accountId: string) => {
    return db.project.findFirst({
        where: {
            Account: {
                id: accountId
            }
        },
        include: {
            Account: true,
            Contact: true,
            Contract: true,
        },
    });
};

const __getInvoicesWithAccountContactContractProject = async (accountId: string) => {
    return db.invoice.findFirst({
        where: {
            Account: {
                id: accountId
            }
        },
        include: {
            Account: true,
            Contact: {
                include: {
                    BillingAddress: true
                }
            },
            Project: true
        },
    });
};

const __getTasksWithAllRelations = async (laneId: string) => {
    return db.task.findMany({
        where: {
            laneId: laneId
        },
        include: {
            Contact: true,
            Lane: true,
            Tags: true,
            Project: true,
        }
    })
}

const __getTasksWithTags = async (kanbanId: string) => {
    return db.task.findMany({
        where: {
            Lane: {
                kanbanId
            }
        },
        include: {
            Tags: true,
            Contact: true,
            Project: true,
        }
    })
}

export type AuthUserWithSidebarOptions = Prisma.PromiseReturnType<typeof getAuthUserDetails>

export type ProjectsWithAccountContactContracts =
    Prisma.PromiseReturnType<typeof __getProjectsWithAccountContactContracts>;

export type InvoicesWithAccountContactContractProject =
    Prisma.PromiseReturnType<typeof __getInvoicesWithAccountContactContractProject>;

export type GetMediaFiles = Prisma.PromiseReturnType<typeof getMedia>;

export type CreateMediaType = Prisma.MediaCreateWithoutAccountInput;

export type TaskAndTags = Task & {
    Tags: Tag[];
    Contact: Contact | null;
    Project: Project | null;
};

export type LaneDetail = Lane & {
    Tasks: TaskAndTags[]
}

export const CreateKanbanFormSchema = z.object({
    name: z.string().min(1),
})

export type KanbanDetailsWithLanesCardsTasksTags = Prisma.PromiseReturnType<typeof getKanbanDetails>

export type TaskWithTags = Prisma.PromiseReturnType<typeof __getTasksWithTags>

export type TaskDetails = Prisma.PromiseReturnType<typeof __getTasksWithAllRelations>;

export const CreateFunnelFormSchema = z.object({
    name: z.string().min(1),
    description: z.string(),
    subDomainName: z.string().optional(),
    favicon: z.string().optional(),
});

// export type PricesList = Stripe.ApiList<Stripe.Price>;

export interface Address {
    city: string;
    country: string;
    line1: string;
    postal_code: string;
    state: string;
}

export interface ShippingInfo {
    name: string;
    address: Address;
}

export type StripeCustomerType = {
    email: string;
    name: string;
    shipping: ShippingInfo;
    address: Address;
}

export type PriceList = Stripe.ApiList<Stripe.Price>
