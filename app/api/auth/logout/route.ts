import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // Get the access token from cookies
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (accessToken) {
      // Sign out from Supabase
      await adminClient.auth.signOut();
    }

    // Clear cookies and redirect to login using relative path
    const response = NextResponse.redirect(new URL('/login', request.url), {
      status: 302
    });

    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Even on error, redirect to login using relative path
    return NextResponse.redirect(new URL('/login', request.url), {
      status: 302
    });
  }
};
