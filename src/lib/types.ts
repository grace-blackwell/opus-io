import {Prisma, Notification, Lane, Task, Contact, Tag, Project, User, Account, SidebarOption} from "@prisma/client"
import {getAuthUserDetails, getKanbanDetails, getMedia} from "@/lib/queries";
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

export type UserWithAccount = User & {
    Account: Account & {
    SidebarOption: SidebarOption[]
    Contacts: Contact[]
    }
}

export type AuthUserWithSidebarOptions = Prisma.PromiseReturnType<typeof getAuthUserDetails>

export type ProjectsWithAccountContactContracts = Prisma.ProjectGetPayload<{
    include: {
        Account: true,
        Contact: true,
        Contract: true,
    }
}>;

export type InvoicesWithAccountContactContractProject = Prisma.InvoiceGetPayload<{
    include: {
        Account: true,
        Contact: {
            include: {
                BillingAddress: true
            }
        },
        Project: true
    }
}>;

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

export type TaskWithTags = Prisma.TaskGetPayload<{
    include: {
        Tags: true,
        Contact: true,
        Project: true
    }
}>

export type TaskDetails = Prisma.TaskGetPayload<{
    include: {
        Contact: true,
        Lane: true,
        Tags: true,
        Project: true
    }
}>;

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

export type InvoiceItem = {
    id: string
    description: string
    quantity: string
    unitPrice: string
    amount: string
}

export type BillingAddressType = {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
} | null

export type InvoiceDataType = {
    id: string
    invoiceNumber: number // Will be converted to BigInt in convertToInvoiceWithRelations
    invoiceDate: Date
    dueDate: Date
    paymentStatus: string
    currency: string
    unitType: string
    unitPrice: number
    quantity: number
    subtotal: number
    salesTaxRate?: number
    salesTaxAmount?: number
    totalDue: number
    taxId?: string // Added to match the Invoice model
    Account: Account
    Contact: {
        id: string
        contactName: string
        contactEmail?: string | null
        contactPhone?: string | null
        BillingAddress: BillingAddressType
    }
    Project: {
        projectTitle: string
        status: string
    }
    items: InvoiceItem[] // Not part of the Prisma model, handled separately
    notes?: string
    terms?: string
}
