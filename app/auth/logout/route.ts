import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createSupabaseServerClient();
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }

    return NextResponse.redirect(new URL('/login', request.url));
}
