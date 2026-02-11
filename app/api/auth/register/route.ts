import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

// Validation schema for registration
const registerSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone must be at least 10 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    distributor_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        const validatedData = registerSchema.parse(body);
        const { fullName, phone, email, password, distributor_id } = validatedData;

        // Check if email already exists
        const { data: existingUser, error: emailCheckError } = await adminClient
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: 'This email is already registered' },
                { status: 400 }
            );
        }

        if (emailCheckError && emailCheckError.code !== 'PGRST116') {
            console.error('Error checking email:', emailCheckError);
            return NextResponse.json(
                { error: 'An error occurred while checking availability' },
                { status: 500 }
            );
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                phone,
            },
        });

        if (authError || !authData.user) {
            console.error('Error creating auth user:', authError);
            return NextResponse.json(
                { error: 'Failed to create user account' },
                { status: 500 }
            );
        }

        const userId = authData.user.id;

        // Insert profile
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
                id: userId,
                auth_user_id: userId,
                email,
                full_name: fullName,
                phone,
                is_active: true,
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            // Rollback: delete the auth user
            await adminClient.auth.admin.deleteUser(userId);
            return NextResponse.json(
                { error: 'Failed to create user profile' },
                { status: 500 }
            );
        }

        // If distributor_id is provided, create the relationship
        if (distributor_id) {
            const { error: distributorUserError } = await adminClient
                .from('distributor_users')
                .insert({
                    distributor_id: distributor_id,
                    user_id: userId,
                    role: 'client',
                    is_active: true,
                });

            if (distributorUserError) {
                console.error('Error creating distributor user relationship:', distributorUserError);
                // Note: We don't rollback here as the user is already created
                // The admin can manually fix this if needed
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: 'User registered successfully',
                data: {
                    userId,
                },
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Registration error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'An unexpected error occurred during registration' },
            { status: 500 }
        );
    }
}
