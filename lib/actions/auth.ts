'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server Action to sign out the current user.
 * This action can be used directly in forms without requiring client-side JavaScript.
 */
export async function signOutAction() {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
    return redirect('/login')
}
