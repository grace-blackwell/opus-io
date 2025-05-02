'use server'

import {currentUser} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import {db} from "@/lib/db";
import {$Enums, Account, BillingAddress, Contact, Lane, Prisma, Tag, Task, User} from "@prisma/client";
import Plan = $Enums.Plan;
import {CreateFunnelFormSchema, CreateMediaType} from "@/lib/types";
import {nanoid} from "nanoid";
import {z} from "zod";

export const getAuthUserDetails = async () => {
    const user = await currentUser();

    if (!user) {
        return
    }

    return db.user.findUnique({
        where: {
            email: user.emailAddresses[0].emailAddress,
        },
        include: {
            Account: {
                include: {
                    SidebarOption: true,
                    Contacts: true,
                }
            }
        }
    });
}

export const verifyAndAcceptAccount = async () => {
    const user = await currentUser();
    if (!user) return redirect("/sign-in")

    const userData = await getAuthUserDetails()

    const accountExists = await db.account.findFirst({
        where: {
            accountEmail: userData?.email
        },
    })

    if (accountExists){
        const existingUser = await getAuthUserDetails()
        if (existingUser)
            return existingUser.accountId
    }

    // Only create a notification if the account exists
    if (accountExists?.id) {
        await saveActivityLogNotification(accountExists.id, `Joined`)
    }

    const account = await db.user.findUnique({
        where: {
            email: user.emailAddresses[0].emailAddress,
        }
    })
    return account ? account.accountId : null;
}

export const saveActivityLogNotification = async (accountId: string, description?: string) => {
    if (!accountId) {
        console.log("No account ID provided, skipping notification creation")
        return
    }

    const authUser = await currentUser()
    let userData;
    console.log("Auth User ID: ", authUser?.id)
    if(!authUser){
        const response = await db.user.findFirst({
            where: {
                Account : {
                    id: accountId
                }
            }
        })
        if(response) {
            userData = response;
        }
    } else {
        userData = await db.user.findUnique({
            where: {
                email: authUser.emailAddresses[0].emailAddress
            },
        })
    }
    if (!userData) {
        console.log("Couldn't find valid userData")
        return
    }

    await db.notification.create({
        data: {
            notification: `${userData.firstName} ${userData.lastName} | ${description}`,
            User: {
                connect: {
                    id: userData.id
                }
            },
            Account: {
                connect: {
                    id: accountId
                }
            },
        }
    })
}

export const updateAccountDetails = async (accountId: string, accountDetails:Partial<Account>) => {
    if (!accountId) return;
    return db.account.update({
        where: {id: accountId},
        data: {...accountDetails}
    });
}

export const updateContactDetails = async (accountId: string, accountDetails:Partial<Account>) => {
    if (!accountId) return;
    return db.account.update({
        where: {id: accountId},
        data: {...accountDetails}
    });
}

export const deleteAccount = async (accountId:string) => {
    return db.account.delete({
        where: {id: accountId}
    })
}

export const updateUser = async (user: Partial<User>) => {
    return db.user.update({
        where: {id: user.id},
        data: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            accountId: user.accountId,
            updatedAt: new Date()
        },
    });
}

export const updateOrCreateUser = async () => {
    const user = await currentUser();
    if (!user) return redirect("/sign-in")

    const userDetails = {
        id: user.id,
        accountId: '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.emailAddresses[0].emailAddress,
        avatarUrl: user.imageUrl
    };

    return db.user.upsert({
        where: {
            email: userDetails.email
        },
        update: {
            ...userDetails
        },
        create: {
            ...userDetails
        }
    })
}

export const createOrUpdateContact = async (contact: Contact, account: Account, billingAddress: Partial<BillingAddress>, contactTags: any[] = []) => {

    try {
        let existingBillingAddressByContactId;
        const billingUpdateData = {
            street: billingAddress.street,
            city: billingAddress.city,
            state: billingAddress.state,
            country: billingAddress.country,
            zipCode: billingAddress.zipCode,
            updatedAt: new Date()
        }

        const existingContactById = await db.contact.findUnique({
            where: {
                id: contact.id
            }
        });

        console.log('Checking for existing contact with id:', contact.id);
        console.log('Existing contact found by id:', existingContactById);

        if (existingContactById) {
            console.log('Updating existing contact with ID:', existingContactById.id);

            existingBillingAddressByContactId = await db.billingAddress.findFirst({
                where: {
                    contactId: existingContactById.id
                }
            })

            console.log('Checking for existing billing address for contact...')
            console.log('Existing billing address found for contact:', existingBillingAddressByContactId);

            if(existingBillingAddressByContactId) {
                console.log('Contact already has a billing address with ID: ', existingBillingAddressByContactId.id)
                console.log('Updating existing billing address')

                await db.billingAddress.update({
                    where: {id: existingBillingAddressByContactId.id},
                    data: billingUpdateData
                })
            } else if (billingAddress.street || billingAddress.city || billingAddress.state || billingAddress.zipCode || billingAddress.country) {
                // If contact doesn't have a billing address but we're providing one, create it
                console.log('Creating new billing address for existing contact')
                await db.billingAddress.create({
                    data: {
                        id: billingAddress.id,
                        street: billingAddress.street || '',
                        city: billingAddress.city || '',
                        state: billingAddress.state || '',
                        zipCode: billingAddress.zipCode || '',
                        country: billingAddress.country || '',
                        contactId: contact.id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                })
            }

            const updateData = {
                contactName: contact.contactName,
                contactEmail: contact.contactEmail,
                contactPhone: contact.contactPhone,
                contactWebsite: contact.contactWebsite,
                accountId: contact.accountId,
                updatedAt: new Date(),
                ContactTags: {
                    set: contactTags.map(tag => ({ id: tag.id }))
                }
            };
            
            console.log('Updating contact with tags:', contactTags.map(tag => ({ id: tag.id })));

            return await db.contact.update({
                where: { id: contact.id },
                data: updateData,
                include: {
                    ContactTags: true
                }
            });
        }

        console.log('Creating new contact with ID:', contact.id);

        const contactData = {
            contactName: contact.contactName,
            contactEmail: contact.contactEmail,
            contactPhone: contact.contactPhone,
            contactWebsite: contact.contactWebsite,
            accountId: contact.accountId,
            updatedAt: new Date(),
            BillingAddress: {
                create: {
                    id: billingAddress.id,
                    street: billingAddress.street || '',
                    city: billingAddress.city || '',
                    state: billingAddress.state || '',
                    zipCode: billingAddress.zipCode || '',
                    country: billingAddress.country || '',
                    createdAt: billingAddress.createdAt || new Date(),
                    updatedAt: billingAddress.updatedAt || new Date()
                }
            },
            ContactTags: {
                connect: contactTags.map(tag => ({ id: tag.id }))
            }
        };
        
        console.log('Creating contact with tags:', contactTags.map(tag => ({ id: tag.id })));

        const result = await db.contact.create({
            data: contactData,
            include: {
                ContactTags: true
            }
        });

        console.log('Contact creation successful:', {
            id: result.id,
            contactEmail: result.contactEmail
        });

        return result;
    }catch (error) {
        console.error('Error creating/updating contact:', error);
        return null;
    }
}

export const deleteContact = async (contactId: string) => {
    try {
        // First, delete the billing address if it exists
        const billingAddress = await db.billingAddress.findFirst({
            where: {
                contactId: contactId
            }
        });

        if (billingAddress) {
            await db.billingAddress.delete({
                where: {
                    id: billingAddress.id
                }
            });
        }

        // Then delete the contact
        return await db.contact.delete({
            where: {
                id: contactId
            }
        });
    } catch (error) {
        console.error('Error deleting contact:', error);
        return null;
    }
}

export const createOrUpdateAccount = async (account: Account, price?: Plan) => {

    console.log('createOrUpdateAccount called with:', {
        id: account.id,
        accountEmail: account.accountEmail,
        accountName: account.accountName
    });

    const user = await currentUser();
    if (!user) return redirect("/sign-in")

    if (!account.accountEmail) {
        console.log('Account email is undefined or null');
        return null;
    }

    try {
        const existingAccountByUserId = await db.account.findFirst({
            where: {
                userId: user.id
            }
        });

        console.log('Checking for existing account with userId...');
        console.log('Existing account found by userId:', existingAccountByUserId);

        // If user already has an account with a different ID, update that account
        if (existingAccountByUserId && existingAccountByUserId.id !== account.id) {
            console.log('User already has an account with different ID:', existingAccountByUserId.id);
            console.log('Updating existing account');

            // Update the existing account with the new data
            const updateData = {
                accountName: account.accountName,
                accountEmail: account.accountEmail.trim(),
                title: account.title || '',
                connectedAccountId: account.connectedAccountId || '',
                logo: account.logo || '',
                updatedAt: new Date(),
                address: account.address || '',
                city: account.city || '',
                state: account.state || '',
                country: account.country || '',
                zipCode: account.zipCode || '',
            };

            const result = await db.account.update({
                where: { id: existingAccountByUserId.id },
                data: updateData
            });

            await connectUserToAccount(user.id, result.id);

            return result;
        }

        const existingAccountById = await db.account.findUnique({
            where: {
                id: account.id
            }
        });

        console.log('Checking for existing account with id:', account.id);
        console.log('Existing account found by id:', existingAccountById);

        // If account exists, update it
        if (existingAccountById) {
            console.log('Updating existing account with ID:', existingAccountById.id);

            // Update the existing account with the new data
            const updateData = {
                accountName: account.accountName,
                accountEmail: account.accountEmail.trim(),
                title: account.title || '',
                connectedAccountId: account.connectedAccountId || '',
                logo: account.logo || '',
                updatedAt: new Date(),
                address: account.address || '',
                city: account.city || '',
                state: account.state || '',
                country: account.country || '',
                zipCode: account.zipCode || '',
            };

            const result = await db.account.update({
                where: { id: account.id },
                data: updateData
            });

            // Make sure the user is connected to this account
            await connectUserToAccount(user.id, result.id);

            return result;
        }

        console.log('Creating new account with ID:', account.id);

        const accountData = {
            id: account.id,
            accountName: account.accountName,
            accountEmail: account.accountEmail.trim(),
            title: account.title || '',
            connectedAccountId: account.connectedAccountId || '',
            logo: account.logo || '',
            createdAt: account.createdAt || new Date(),
            updatedAt: new Date(),
            userId: user.id,
            address: account.address || '',
            city: account.city || '',
            state: account.state || '',
            country: account.country || '',
            zipCode: account.zipCode || '',
        };

        const result = await db.account.create({
            data: {
                ...accountData,
                SidebarOption: {
                    create: [
                        {
                            name: 'Dashboard',
                            icon: 'category',
                            link: `/account/${account.id}`
                        },
                        {
                            name: 'Launchpad',
                            icon: 'clipboard',
                            link: `/account/${account.id}/launchpad`
                        },
                        {
                            name: 'Contacts',
                            icon: 'person',
                            link: `/account/${account.id}/contacts`
                        },
                        {
                            name: 'Projects',
                            icon: 'briefcase',
                            link: `/account/${account.id}/projects`
                        },
                        {
                            name: 'Invoices',
                            icon: 'receipt',
                            link: `/account/${account.id}/invoices`
                        },
                        {
                            name: 'Kanbans',
                            icon: 'kanban',
                            link: `/account/${account.id}/kanbans`
                        },
                        {
                            name: 'Automations',
                            icon: 'chip',
                            link: `/account/${account.id}/automations`
                        },
                        {
                            name: 'Media',
                            icon: 'media',
                            link: `/account/${account.id}/media`
                        },
                        {
                            name: 'Billing',
                            icon: 'payment',
                            link: `/account/${account.id}/billing`
                        },
                        {
                            name: 'Settings',
                            icon: 'settings',
                            link: `/account/${account.id}/settings`
                        },
                    ]
                }
            }
        });

        // Make sure the user is connected to this account
        await connectUserToAccount(user.id, result.id);

        console.log('Account creation successful:', {
            id: result.id,
            accountEmail: result.accountEmail
        });

        return result;
    } catch (error) {
        console.error('Error creating/updating account:', error);
        return null;
    }
}

/**
 * Helper function to connect a user to an account
 */
async function connectUserToAccount(userId: string, accountId: string) {
    try {
        console.log('Connecting user to account:', {
            userId,
            accountId
        });

        const user = await currentUser();

        if (!user) {
            console.log('No current user found, skipping user update');
            return;
        }

        await db.user.update({
            where: { id: userId },
            data: { accountId }
        });

        console.log('User successfully connected to account');
    } catch (error) {
        console.error('Error connecting user to account:', error);
        // Continue anyway since the account was created/updated
    }
}

export const getNotificationAndUser = async (accountId: string) => {
    try {
        return await db.notification.findMany({
            where: {accountId},
            include: {User: true},
            orderBy: {createdAt: 'desc'},
        })
    } catch (error) {
        console.log(error)
    }
}

export const getContactDetails = async (contactId: string) => {
    try{
        return await db.contact.findUnique({
            where: {
                id: contactId
            },
        })
    } catch (e){console.log(e)}
}

export const getProject = async (projectId: string) => {
    try{
        return await db.project.findUnique({
            where: {
                id: projectId
            },
            include:{
                Contact: true,
                Account: true,
                Contract: true
            }
        })
    } catch (e){console.log(e)}
}

export const createOrUpdateProject = async (project: Partial<any>, accountId: string) => {
    try {
        console.log('createOrUpdateProject called with:', {
            id: project.id,
            projectTitle: project.projectTitle,
            accountId: accountId
        });

        const user = await currentUser();
        if (!user) return redirect("/sign-in");

        // Check if project exists
        const existingProjectById = project.id ? await db.project.findUnique({
            where: {
                id: project.id
            }
        }) : null;

        console.log('Checking for existing project with id:', project.id);
        console.log('Existing project found by id:', existingProjectById);

        // If project exists, update it
        if (existingProjectById) {
            console.log('Updating existing project with ID:', existingProjectById.id);

            const updateData = {
                projectTitle: project.projectTitle,
                description: project.description,
                projectId: project.projectId,
                contactId: project.contactId,
                estimatedHours: project.estimatedHours ? parseFloat(project.estimatedHours) : null,
                actualHours: project.actualHours ? parseFloat(project.actualHours) : null,
                estimatedCost: project.estimatedCost ? parseFloat(project.estimatedCost) : null,
                actualCost: project.actualCost ? parseFloat(project.actualCost) : null,
                status: project.status || 'NotStarted',
                updatedAt: new Date(),
            };

            const result = await db.project.update({
                where: { id: project.id },
                data: updateData
            });

            console.log('Project update successful:', {
                id: result.id,
                projectTitle: result.projectTitle
            });

            return result;
        }

        // Create new project
        console.log('Creating new project');

        const projectData = {
            id: project.id,
            projectTitle: project.projectTitle || '',
            description: project.description || '',
            projectId: project.projectId || '',
            contactId: project.contactId || null,
            accountId: accountId,
            estimatedHours: project.estimatedHours ? parseFloat(project.estimatedHours) : null,
            actualHours: project.actualHours ? parseFloat(project.actualHours) : null,
            estimatedCost: project.estimatedCost ? parseFloat(project.estimatedCost) : null,
            actualCost: project.actualCost ? parseFloat(project.actualCost) : null,
            status: project.status || 'NotStarted',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.project.create({
            data: projectData
        });

        console.log('Project creation successful:', {
            id: result.id,
            projectTitle: result.projectTitle
        });

        return result;
    } catch (error) {
        console.error('Error creating/updating project:', error);
        return null;
    }
}

export const deleteProject = async (projectId: string) => {
    try {
        return await db.project.delete({
            where: {
                id: projectId
            }
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        return null;
    }
}

export const getNextInvoiceNumber = async () => {
    try {
        // Find the highest invoice number in the database
        const highestInvoice = await db.invoice.findFirst({
            orderBy: {
                invoiceNumber: 'desc'
            },
            select: {
                invoiceNumber: true
            }
        });

        // If no invoices exist, start with 101, otherwise increment the highest
        return highestInvoice ? Number(highestInvoice.invoiceNumber) + 1 : 101;

    } catch (error) {
        console.error('Error getting next invoice number:', error);
        return 101; // Default to 101 if there's an error
    }
}

export const createOrUpdateInvoice = async (invoice: Partial<any>, accountId: string) => {
    try {
        console.log('createOrUpdateInvoice called with:', {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            accountId: accountId
        });

        const user = await currentUser();
        if (!user) return redirect("/sign-in");

        // Check if invoice exists
        const existingInvoiceById = invoice.id ? await db.invoice.findUnique({
            where: {
                id: invoice.id
            }
        }) : null;

        console.log('Checking for existing invoice with id:', invoice.id);
        console.log('Existing invoice found by id:', existingInvoiceById);

        // If invoice exists, update it
        if (existingInvoiceById) {
            console.log('Updating existing invoice with ID:', existingInvoiceById.id);

            const updateData = {
                invoiceDate: new Date(invoice.invoiceDate),
                dueDate: new Date(invoice.dueDate),
                paymentStatus: invoice.paymentStatus,
                currency: invoice.currency,
                unitType: invoice.unitType,
                unitPrice: parseFloat(invoice.unitPrice),
                quantity: parseInt(invoice.quantity),
                subtotal: parseFloat(invoice.subtotal),
                salesTaxRate: invoice.salesTaxRate ? parseFloat(invoice.salesTaxRate) : null,
                salesTaxAmount: invoice.salesTaxAmount ? parseFloat(invoice.salesTaxAmount) : null,
                totalDue: parseFloat(invoice.totalDue),
                taxId: invoice.taxId || null,
                contactId: invoice.contactId,
                projectId: invoice.projectId,
                updatedAt: new Date(),
            };

            const result = await db.invoice.update({
                where: { id: invoice.id },
                data: updateData
            });

            console.log('Invoice update successful:', {
                id: result.id,
                invoiceNumber: result.invoiceNumber
            });

            return result;
        }

        // Create new invoice
        console.log('Creating new invoice');

        // Get the next invoice number
        const nextInvoiceNumber = await getNextInvoiceNumber();

        const invoiceData = {
            id: invoice.id,
            invoiceNumber: BigInt(nextInvoiceNumber),
            invoiceDate: new Date(invoice.invoiceDate),
            dueDate: new Date(invoice.dueDate),
            paymentStatus: invoice.paymentStatus || 'Unpaid',
            currency: invoice.currency || 'USD',
            unitType: invoice.unitType || 'Hourly',
            unitPrice: parseFloat(invoice.unitPrice),
            quantity: parseInt(invoice.quantity),
            subtotal: parseFloat(invoice.subtotal),
            salesTaxRate: invoice.salesTaxRate ? parseFloat(invoice.salesTaxRate) : null,
            salesTaxAmount: invoice.salesTaxAmount ? parseFloat(invoice.salesTaxAmount) : null,
            totalDue: parseFloat(invoice.totalDue),
            taxId: invoice.taxId || null,
            contactId: invoice.contactId,
            projectId: invoice.projectId,
            accountId: accountId,
            contractId: "placeholder", // Temporary placeholder, will be updated later
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.invoice.create({
            data: invoiceData
        });

        console.log('Invoice creation successful:', {
            id: result.id,
            invoiceNumber: result.invoiceNumber
        });

        return result;
    } catch (error) {
        console.error('Error creating/updating invoice:', error);
        return null;
    }
}

export const getInvoice = async (invoiceId: string) => {
    try {
        return await db.invoice.findUnique({
            where: {
                id: invoiceId
            },
            include: {
                Contact: true,
                Account: true,
                Project: true,
                Contract: true
            }
        });
    } catch (error) {
        console.error('Error getting invoice:', error);
        return null;
    }
}

export const deleteInvoice = async (invoiceId: string) => {
    try {
        return await db.invoice.delete({
            where: {
                id: invoiceId
            }
        });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        return null;
    }
}

export const getMedia = async (accountId: string) => {
    try {
        return await db.account.findUnique({
            where: {
                id: accountId
            },
            include: {
                Media: true
            }
        });

    } catch (error) {
        console.error('Error getting media:', error);
        return null
    }
}

export const createMedia = async (accountId: string, mediaFile:CreateMediaType) => {
    return db.media.create({
        data: {
            link: mediaFile.link,
            name: mediaFile.name,
            accountId: accountId
        }
    });
}

export const deleteMedia = async (mediaId:string) => {
    return db.media.delete({
        where: {
            id: mediaId
        }
    });
}

export const getKanbanDetails = async (kanbanId: string) => {
    try{
        return await db.kanban.findUnique({
            where: {
                id: kanbanId
            },
        })
    } catch (e){console.log(e)}
}

export const getLanesWithTasksAndTags = async (kanbanId: string) => {
    try{
        return await db.lane.findMany({
            where: {
                kanbanId: kanbanId
            },
            orderBy: {
                order: 'asc'
            },
            include:{
                Tasks: {
                    orderBy: {
                        order: 'asc'
                    },
                    include: {
                        Contact: true,
                        Tags: true,
                        Project: true,
                    },
                },
            }
        })
    } catch (e){console.log(e)}
}

export const upsertKanban = async (kanban: Prisma.KanbanUncheckedCreateWithoutLaneInput) => {
    return db.kanban.upsert({
        where: {
            id: kanban.id || nanoid()
        },
        update: kanban,
        create: kanban
    })
}

export const deleteKanban = async (kanbanId: string) => {
    return db.kanban.delete({
        where: {
            id: kanbanId
        }
    })
}

export const getAccountProjects = async (accountId: string) => {
    return db.project.findMany({
        where: {
            accountId: accountId
        }
    })
}

export const updateLanesOrder = async (lanes: Lane[]) => {
    try {
        const updateTrans = lanes.map((lane) =>
            db.lane.update({
                where: { id: lane.id },
                data: { order: lane.order }
            })
        )
        await db.$transaction(updateTrans)
        console.log('Successfully updated lanes order')
    } catch (error) {
        console.log(error, 'error updating lanes order')
    }
}

export const updateTasksOrder = async (tasks: Task[]) => {
    try {
        const updateTrans = tasks.map((task) =>
            db.task.update({
                where: {
                    id: task.id
                },
                data: {
                    order: task.order,
                    laneId: task.laneId
                }
            })
        )
        await db.$transaction(updateTrans)
        console.log('Successfully updated tasks order')
    } catch (error) {
        console.log(error, 'error updating tasks order')
    }
}

export const upsertLane = async (lane: Prisma.LaneUncheckedCreateInput) => {
    let order: number

    if(!lane.order) {
        const lanes = await db.lane.findMany({
            where: {
                kanbanId: lane.kanbanId
            },
        })
        order = lanes.length
    } else {
        order = lane.order
    }
    return db.lane.upsert({
        where: {
            id: lane.id || nanoid()
        },
        update: lane,
        create: {...lane, order}
    })
}

export const deleteLane = async (laneId: string) => {
    return db.lane.delete({
        where: {
            id: laneId
        }
    })
}

export const getAccountContacts = async (accountId: string) => {
    return db.contact.findMany({
        where: {
            accountId: accountId
        },
        include: {
            ContactTags: true
        }
    })
}

export const searchContacts = async (searchTerms: string, accountId: string) => {
    return db.contact.findMany({
        where: {
            accountId: accountId,
            contactName: {
                contains: searchTerms,
            }
        },
        include: {
            ContactTags: true
        }
    })
}

export const upsertTask = async (task: Prisma.TaskUncheckedCreateInput, tags: Tag[]) => {
    let order:number
    if(!task.order){
        const tasks = await db.task.findMany({
            where:{laneId: task.laneId},
        })
        order = tasks.length
    } else {
        order = task.order
    }

    return db.task.upsert({
        where: {
            id: task.id || nanoid()
        },
        update: {...task, Tags: {set: tags}},
        create: {...task, Tags: {connect: tags}, order},
        include: {
            Contact: true,
            Lane: true,
            Tags: true,
            Project: true
        }
    })
}

export const deleteTask = async (taskId: string) => {
    return db.task.delete({
        where: {
            id: taskId
        }
    })
}

export const upsertFunnel = async (
    accountId: string,
    funnel: z.infer<typeof CreateFunnelFormSchema> & {liveProducts: string},
    funnelId: string
    ) => {
    return db.funnel.upsert({
        where: {
            id: funnelId
        },
        update: funnel,
        create: {
            ...funnel,
            id: funnelId || nanoid(),
            accountId: accountId,
        }
    })
}

// Time tracking functions
export const startTaskTimeTracking = async (taskId: string) => {
    const now = new Date();
    
    // Get task details including project info
    const task = await db.task.findUnique({
        where: { id: taskId },
        select: { 
            projectId: true,
            Project: { 
                select: { 
                    id: true,
                    accountId: true,
                    isTracking: true
                } 
            } 
        }
    });
    
    if (!task) {
        throw new Error('Task not found');
    }
    
    const accountId = task.Project?.accountId || '';
    
    // If the project is currently being tracked, stop the project timer first
    if (task.projectId && task.Project?.isTracking) {
        await stopProjectTimeTracking(task.projectId);
    }
    
    // Create a new time entry
    await db.timeEntry.create({
        data: {
            taskId,
            startTime: now,
            accountId: accountId,
        }
    });
    
    // Update the task's tracking status
    return db.task.update({
        where: { id: taskId },
        data: {
            isTracking: true,
            trackedStartTime: now,
        },
        include: {
            Project: true,
            Contact: true,
            Tags: true,
        }
    });
}

export const stopTaskTimeTracking = async (taskId: string) => {
    const task = await db.task.findUnique({
        where: { id: taskId },
        select: {
            trackedStartTime: true,
            totalTrackedTime: true,
            projectId: true,
        }
    });
    
    if (!task || !task.trackedStartTime) {
        throw new Error('Task is not currently being tracked');
    }
    
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - task.trackedStartTime.getTime()) / 1000);
    const newTotalTime = task.totalTrackedTime + elapsedSeconds;
    
    // Update the latest time entry
    await db.timeEntry.updateMany({
        where: {
            taskId,
            endTime: null,
        },
        data: {
            endTime: now,
            duration: elapsedSeconds,
        }
    });
    
    // If the task belongs to a project, update the project's total time as well
    if (task.projectId) {
        const project = await db.project.findUnique({
            where: { id: task.projectId },
            select: { totalTrackedTime: true }
        });
        
        if (project) {
            await db.project.update({
                where: { id: task.projectId },
                data: {
                    totalTrackedTime: project.totalTrackedTime + elapsedSeconds
                }
            });
        }
    }
    
    // Update the task's tracking status and total time
    return db.task.update({
        where: { id: taskId },
        data: {
            isTracking: false,
            trackedStartTime: null,
            totalTrackedTime: newTotalTime,
        },
        include: {
            Project: true,
            Contact: true,
            Tags: true,
        }
    });
}

export const startProjectTimeTracking = async (projectId: string) => {
    const now = new Date();
    
    // Get the project with its tasks
    const project = await db.project.findUnique({
        where: { id: projectId },
        select: { 
            accountId: true,
            Tasks: {
                select: {
                    id: true,
                    isTracking: true
                }
            }
        }
    });
    
    if (!project) {
        throw new Error('Project not found');
    }
    
    // Stop any running task timers to prevent double-counting
    for (const task of project.Tasks) {
        if (task.isTracking) {
            await stopTaskTimeTracking(task.id);
        }
    }
    
    try {
        // Create a new time entry for the project
        await db.timeEntry.create({
            data: {
                projectId,
                startTime: now,
                accountId: project.accountId || '',
                description: 'Project-level time tracking'
            }
        });
        
        // Update the project's tracking status
        return db.project.update({
            where: { id: projectId },
            data: {
                isTracking: true,
                trackedStartTime: now,
            },
            include: {
                Contact: true
            }
        });
    } catch (error) {
        console.error('Error in startProjectTimeTracking:', error);
        throw new Error(`Failed to start project time tracking: ${error}`);
    }
}

export const stopProjectTimeTracking = async (projectId: string) => {
    try {
        const project = await db.project.findUnique({
            where: { id: projectId },
            select: {
                trackedStartTime: true,
                totalTrackedTime: true,
            }
        });
        
        if (!project || !project.trackedStartTime) {
            throw new Error('Project is not currently being tracked');
        }
        
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - project.trackedStartTime.getTime()) / 1000);
        const newTotalTime = project.totalTrackedTime + elapsedSeconds;
        
        // Update the latest time entry for this project
        await db.timeEntry.updateMany({
            where: {
                projectId,
                endTime: null,
            },
            data: {
                endTime: now,
                duration: elapsedSeconds,
            }
        });
        
        // Get all tasks for this project
        const tasks = await db.task.findMany({
            where: { projectId },
            select: { id: true, trackedStartTime: true, totalTrackedTime: true }
        });
        
        // Stop time entries for all tasks
        for (const task of tasks) {
            if (task.trackedStartTime) {
                const taskElapsedSeconds = Math.floor((now.getTime() - task.trackedStartTime.getTime()) / 1000);
                const taskNewTotalTime = task.totalTrackedTime + taskElapsedSeconds;
                
                // Update the latest time entry for this task
                await db.timeEntry.updateMany({
                    where: {
                        taskId: task.id,
                        endTime: null,
                    },
                    data: {
                        endTime: now,
                        duration: taskElapsedSeconds,
                    }
                });
                
                // Update the task's tracking status and total time
                await db.task.update({
                    where: { id: task.id },
                    data: {
                        isTracking: false,
                        trackedStartTime: null,
                        totalTrackedTime: taskNewTotalTime,
                    }
                });
            }
        }
        
        // Update the project's tracking status and total time
        return db.project.update({
            where: { id: projectId },
            data: {
                isTracking: false,
                trackedStartTime: null,
                totalTrackedTime: newTotalTime,
            },
            include: {
                Contact: true
            }
        });
    } catch (error) {
        console.error('Error in stopProjectTimeTracking:', error);
        throw new Error(`Failed to stop project time tracking: ${error}`);
    }
}

export const getTimeEntriesForTask = async (taskId: string) => {
    return db.timeEntry.findMany({
        where: { taskId },
        orderBy: { startTime: 'desc' }
    });
}

export const getTimeEntriesForProject = async (projectId: string) => {
    const tasks = await db.task.findMany({
        where: { projectId },
        select: { id: true, name: true }
    });
    
    const taskIds = tasks.map(task => task.id);
    
    // Get all time entries for the project and its tasks
    const timeEntries = await db.timeEntry.findMany({
        where: {
            OR: [
                { projectId },
                { taskId: { in: taskIds } }
            ]
        },
        orderBy: { startTime: 'desc' },
        include: {
            Task: {
                select: {
                    id: true,
                    name: true
                }
            },
            Project: {
                select: {
                    id: true,
                    projectTitle: true
                }
            }
        }
    });
    
    return timeEntries;
}

export const getTagsForAccount = async (accountId: string) => {
    return db.account.findUnique({
        where: {
            id: accountId
        },
        include: {
            Tags: true
        }
    });
}

export const upsertTag = async (accountId: string, tag: Tag) => {
    return db.tag.upsert({
        where: {
            id: tag.id
        },
        update: {
            name: tag.name,
            color: tag.color,
            updatedAt: new Date()
        },
        create: {
            id: tag.id,
            name: tag.name,
            color: tag.color,
            accountId: accountId,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    });
}

export const deleteTag = async (tagId: string) => {
    return db.tag.delete({
        where: {
            id: tagId
        }
    });
}

// Contact Tag specific functions
export const getContactTagsForAccount = async (accountId: string) => {
    return db.account.findUnique({
        where: {
            id: accountId
        },
        include: {
            ContactTags: true
        }
    });
}

export const upsertContactTag = async (accountId: string, tag: any) => {
    return db.contactTag.upsert({
        where: {
            id: tag.id
        },
        update: {
            name: tag.name,
            color: tag.color,
            updatedAt: new Date()
        },
        create: {
            id: tag.id,
            name: tag.name,
            color: tag.color,
            accountId: accountId,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    });
}

export const deleteContactTag = async (tagId: string) => {
    return db.contactTag.delete({
        where: {
            id: tagId
        }
    });
}