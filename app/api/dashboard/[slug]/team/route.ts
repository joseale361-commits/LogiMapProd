import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Get distributor
        const distributor = await getDistributorBySlug(slug);
        if (!distributor) {
            return NextResponse.json(
                { success: false, error: 'Distribuidora no encontrada' },
                { status: 404 }
            );
        }

        // Fetch all team members for this distributor
        const { data: teamMembers, error } = await adminClient
            .from('distributor_users')
            .select(`
                *,
                profiles!distributor_users_user_id_fkey (
                    id,
                    full_name,
                    email,
                    phone,
                    avatar_url
                )
            `)
            .eq('distributor_id', distributor.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API] Error fetching team members:', error.message);
            return NextResponse.json(
                { success: false, error: 'Error al cargar el equipo' },
                { status: 500 }
            );
        }

        // Transform data to include profile information
        const members = teamMembers?.map((member: any) => ({
            ...member,
            profile: member.profiles,
        })) || [];

        return NextResponse.json({ success: true, members });
    } catch (error) {
        console.error('[API] Error fetching team:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json();
        const { name, email } = body;

        // Validate input
        if (!name || !email) {
            return NextResponse.json(
                { success: false, error: 'Faltan campos requeridos' },
                { status: 400 }
            );
        }

        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Get distributor
        const distributor = await getDistributorBySlug(slug);
        if (!distributor) {
            return NextResponse.json(
                { success: false, error: 'Distribuidora no encontrada' },
                { status: 404 }
            );
        }

        // Check if email already exists
        const { data: existingUser } = await adminClient
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'El email ya está registrado' },
                { status: 400 }
            );
        }

        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8);

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                full_name: name,
            },
        });

        if (authError || !authData.user) {
            console.error('[API] Error creating auth user:', authError);
            return NextResponse.json(
                { success: false, error: 'Error al crear el usuario' },
                { status: 500 }
            );
        }

        // Create profile
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
                auth_user_id: authData.user.id,
                full_name: name,
                email,
            });

        if (profileError) {
            console.error('[API] Error creating profile:', profileError);
            // Rollback auth user
            await adminClient.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json(
                { success: false, error: 'Error al crear el perfil' },
                { status: 500 }
            );
        }

        // Link user to distributor
        const { error: linkError } = await adminClient
            .from('distributor_users')
            .insert({
                user_id: authData.user.id,
                distributor_id: distributor.id,
                role: 'staff',
                is_active: true,
                hire_date: new Date().toISOString(),
            });

        if (linkError) {
            console.error('[API] Error linking user to distributor:', linkError);
            return NextResponse.json(
                { success: false, error: 'Error al vincular el usuario' },
                { status: 500 }
            );
        }

        // TODO: Send email with temporary password using Resend
        // For now, return the temp password in the response (for testing)
        console.log('[API] Temporary password for', email, ':', tempPassword);

        return NextResponse.json({
            success: true,
            member: {
                id: authData.user.id,
                full_name: name,
                email,
                role: 'staff',
                tempPassword, // Only for testing, remove in production
            },
        });
    } catch (error) {
        console.error('[API] Error creating team member:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
