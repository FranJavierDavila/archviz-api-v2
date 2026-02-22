import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    name: 'ArchViz API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      validate: '/api/validate',
      admin: {
        users: '/api/admin/users'
      }
    }
  });
}
