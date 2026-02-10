import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

// Validation schema for registration
const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = registerSchema.parse(body);
    const { businessName, slug, email, password, fullName } = validatedData;

    // Check if slug already exists
    const { data: existingDistributor, error: slugCheckError } = await adminClient
      .from('distributors')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingDistributor) {
      return NextResponse.json(
        { error: 'This URL is already taken. Please choose another one.' },
        { status: 400 }
      );
    }

    if (slugCheckError && slugCheckError.code !== 'PGRST116') {
      console.error('Error checking slug:', slugCheckError);
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

    // Calculate valid_until date (30 days from now)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    // Insert distributor
    const { data: distributor, error: distributorError } = await adminClient
      .from('distributors')
      .insert({
        name: businessName,
        slug,
        plan_type: 'basic',
        subscription_status: 'active',
        valid_until: validUntil.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (distributorError || !distributor) {
      console.error('Error creating distributor:', distributorError);
      // Rollback: delete the auth user
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create distributor account' },
        { status: 500 }
      );
    }

    // Insert profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        auth_user_id: userId,
        email,
        full_name: fullName,
        is_active: true,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Rollback: delete distributor and auth user
      await adminClient.from('distributors').delete().eq('id', distributor.id);
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Insert distributor_users relationship
    const { error: distributorUserError } = await adminClient
      .from('distributor_users')
      .insert({
        distributor_id: distributor.id,
        user_id: userId,
        role: 'admin',
        is_active: true,
      });

    if (distributorUserError) {
      console.error('Error creating distributor user relationship:', distributorUserError);
      // Rollback: delete profile, distributor, and auth user
      await adminClient.from('profiles').delete().eq('id', userId);
      await adminClient.from('distributors').delete().eq('id', distributor.id);
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to assign user role' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Distributor registered successfully',
        data: {
          distributorId: distributor.id,
          slug: distributor.slug,
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
