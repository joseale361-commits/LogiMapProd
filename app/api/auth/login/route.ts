import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Step 1: Sign in with Supabase Auth using the SERVER client (handles cookies automatically)
    // We use the regular server client here so @supabase/ssr can manage the session cookies correctly.
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Supabase Auth Error:', authError.message);
      return NextResponse.json(
        { error: 'Credenciales inválidas o error de autenticación.' },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'No se pudo iniciar sesión. Por favor, intenta nuevamente.' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Step 2: Check if profile exists (Using Admin Client to bypass RLS)
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    // Step 3: If profile doesn't exist, create it (Using Admin Client)
    if (profileError || !profile) {
      console.log('Profile not found, creating one for user:', userId);

      const fullName = authData.user.user_metadata?.full_name ||
        email.split('@')[0] ||
        'Usuario';

      const profileData = {
        id: userId,
        auth_user_id: userId,
        email,
        full_name: fullName,
        is_active: true,
      };

      const { error: createProfileError } = await adminClient
        .from('profiles')
        .insert(profileData);

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
        return NextResponse.json(
          { error: 'Error al crear tu perfil. Por favor, contacta al soporte.' },
          { status: 500 }
        );
      }

      // We continue with specific internal logic...
      // For simplicity in this fix, we assume profile creation worked and fetch distributors next.
    }

    // Use the profile ID (which matches userId) for queries
    const targetProfileId = userId;
    // (Note: In your schema user_id is the FK to profiles.id)

    // Step 4: Query distributor_users (Using Admin Client to bypass RLS)
    console.log('Checking distributor access for user ID:', targetProfileId);

    // Using direct query for reliability
    const { data: distributorUsers, error: distributorUsersError } = await adminClient
      .from('distributor_users')
      .select(`
        *,
        distributors!inner (
          name,
          slug
        )
      `)
      .eq('user_id', targetProfileId)
      .eq('is_active', true);

    if (distributorUsersError) {
      console.error('Error querying distributor_users:', distributorUsersError);
      return NextResponse.json(
        { error: 'Error al verificar tu acceso. Por favor, contacta al soporte.' },
        { status: 500 }
      );
    }

    if (!distributorUsers || distributorUsers.length === 0) {
      console.log('No distributor access found for user:', targetProfileId);
      console.log('Assuming customer role, redirecting to /shop');

      // User is a customer (not linked to any distributor)
      return NextResponse.json(
        {
          success: true,
          message: 'Login successful',
          data: {
            userId: targetProfileId,
            email: email,
            distributorSlug: null,
            role: 'customer',
          },
        },
        { status: 200 }
      );
    }

    // Step 5: Return success with distributor info and role
    // Cookies are ALREADY SET by signInWithPassword via createSupabaseServerClient
    const firstDistributorUser = distributorUsers[0];
    const distributorSlug = firstDistributorUser.distributors.slug;
    const userRole = firstDistributorUser.role;

    console.log('User role:', userRole, 'Distributor slug:', distributorSlug);

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          userId: targetProfileId,
          email: email, // We verify email from input/auth
          distributorSlug,
          role: userRole,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 }
    );
  }
}
