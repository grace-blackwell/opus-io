import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const accountId = url.searchParams.get('accountId');
        const clientId = url.searchParams.get('clientId');

        if (!accountId) {
            return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
        }

        const whereClause: any = {
            accountId: accountId
        };

        // If clientId is provided, filter projects by client
        if (clientId) {
            whereClause.clientId = clientId;
        }

        const projects = await db.project.findMany({
            where: whereClause,
            orderBy: {
                projectTitle: 'asc'
            }
        });

        return NextResponse.json({ projects });
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}