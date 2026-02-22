import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    message: 'ArchViz API v2 funcionando',
    endpoints: ['/api/validate', '/api/admin/users']
  });
}