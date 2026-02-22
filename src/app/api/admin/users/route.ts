import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser, updateUserRequiresApiKey } from '@/lib/supabase';
import { User } from '@/lib/api-types';

export const dynamic = 'force-dynamic';

// Admin secret for authorization
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminSecret) return true; // Allow if no secret configured
  
  return authHeader === `Bearer ${adminSecret}`;
}

// GET - List all users
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, plan_id, requires_api_key } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await createUser(email, plan_id || 'free', requires_api_key ?? true);

    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PATCH - Update user (e.g., requires_api_key)
export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { user_id, requires_api_key } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (typeof requires_api_key !== 'boolean') {
      return NextResponse.json({ error: 'requires_api_key must be a boolean' }, { status: 400 });
    }

    const success = await updateUserRequiresApiKey(user_id, requires_api_key);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      user_id, 
      requires_api_key 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
