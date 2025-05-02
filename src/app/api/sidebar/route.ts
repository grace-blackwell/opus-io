import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, link, icon, accountId } = await req.json()

    if (!name || !link || !icon || !accountId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if the sidebar option already exists
    const existingSidebarOption = await db.sidebarOption.findFirst({
      where: {
        accountId,
        link,
      },
    })

    if (existingSidebarOption) {
      return NextResponse.json(
        { message: 'Sidebar option already exists', sidebarOption: existingSidebarOption },
        { status: 200 }
      )
    }

    // Create the sidebar option
    const sidebarOption = await db.sidebarOption.create({
      data: {
        name,
        link,
        icon,
        accountId,
      },
    })

    return NextResponse.json(
      { message: 'Sidebar option created successfully', sidebarOption },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating sidebar option:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId parameter' },
        { status: 400 }
      )
    }

    const sidebarOptions = await db.sidebarOption.findMany({
      where: {
        accountId,
      },
    })

    return NextResponse.json({ sidebarOptions }, { status: 200 })
  } catch (error) {
    console.error('Error fetching sidebar options:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      )
    }

    await db.sidebarOption.delete({
      where: {
        id,
      },
    })

    return NextResponse.json(
      { message: 'Sidebar option deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting sidebar option:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}