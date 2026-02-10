import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET() {
    const testUsers = [
        { email: 'cliente1@test.com', password: '123456', full_name: 'Cliente Alpha' },
        { email: 'cliente2@test.com', password: '123456', full_name: 'Cliente Beta' },
        { email: 'cliente3@test.com', password: '123456', full_name: 'Cliente Gamma' },
        { email: 'cliente4@test.com', password: '123456', full_name: 'Cliente Delta' },
        { email: 'cliente5@test.com', password: '123456', full_name: 'Cliente Epsilon' },
    ];

    const results = [];

    try {
        for (const user of testUsers) {
            console.log(`Creating user: ${user.email}`);

            // 1. Create User in Auth
            const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: { full_name: user.full_name }
            });

            if (authError) {
                results.push({ email: user.email, status: 'error', message: authError.message });
                continue;
            }

            // 2. Ensure Profile is created (if not automatic by trigger)
            // Note: Usually a trigger handles this, but we'll do an upsert just in case
            if (authUser.user) {
                const { error: profileError } = await adminClient
                    .from('profiles')
                    .upsert({
                        id: authUser.user.id,
                        email: user.email,
                        full_name: user.full_name,
                        auth_user_id: authUser.user.id,
                    }, { onConflict: 'id' });

                if (profileError) {
                    results.push({ email: user.email, status: 'warning', message: `User created but profile error: ${profileError.message}` });
                } else {
                    results.push({ email: user.email, status: 'success', id: authUser.user.id });
                }
            }
        }

        return NextResponse.json({
            message: 'Seeding completed',
            results
        });
    } catch (err) {
        console.error('Seeding error:', err);
        return NextResponse.json({ error: 'Internal Server Error', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}
