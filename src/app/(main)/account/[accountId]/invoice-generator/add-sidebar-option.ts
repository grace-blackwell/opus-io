'use server'

import { db } from '@/lib/db'
import { saveActivityLogNotification } from '@/lib/queries'

export async function addInvoiceGeneratorToSidebar(accountId: string) {
  try {
    // Check if the sidebar option already exists
    const existingSidebarOption = await db.sidebarOption.findFirst({
      where: {
        accountId,
        link: `/account/${accountId}/invoice-generator`,
      },
    })

    if (existingSidebarOption) {
      console.log('Invoice Generator sidebar option already exists')
      return existingSidebarOption
    }

    // Create the sidebar option
    const sidebarOption = await db.sidebarOption.create({
      data: {
        name: 'Invoice Generator',
        link: `/account/${accountId}/invoice-generator`,
        icon: 'receipt',
        accountId,
      },
    })

    await saveActivityLogNotification(
      accountId,
      'Added Invoice Generator to sidebar'
    )

    console.log('Invoice Generator sidebar option created successfully')
    return sidebarOption
  } catch (error) {
    console.error('Error adding Invoice Generator to sidebar:', error)
    return null
  }
}