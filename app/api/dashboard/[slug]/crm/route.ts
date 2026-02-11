import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { slug } = await params;
        const body = await request.json();
        const { full_name, phone, email, address, city, latitude, longitude, credit_limit } = body;

        const supabase = await createClient();
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const distributor = await getDistributorBySlug(slug);
        if (!distributor) {
            return NextResponse.json({ error: 'Distributor not found' }, { status: 404 });
        }

        // Check if customer profile exists with this email or phone
        let customerId: string;
        let isNewCustomer = false;

        if (email || phone) {
            let query = supabase.from('profiles').select('id');

            if (email && phone) {
                query = query.or(`email.eq.${email},phone.eq.${phone}`);
            } else if (email) {
                query = query.eq('email', email);
            } else if (phone) {
                query = query.eq('phone', phone);
            }

            const { data: existingCustomer } = await query.maybeSingle();

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                // Create new customer profile using raw query to bypass type issues
                const { data: newCustomer, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                        full_name,
                        phone: phone || null,
                        email: email || null
                    } as any)
                    .select()
                    .single();

                if (createError || !newCustomer) {
                    console.error('Error creating customer profile:', createError);
                    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
                }
                customerId = newCustomer.id;
                isNewCustomer = true;
            }
        } else {
            // Create new customer profile without email/phone
            const { data: newCustomer, error: createError } = await supabase
                .from('profiles')
                .insert({
                    full_name,
                    phone: null,
                    email: null
                } as any)
                .select()
                .single();

            if (createError || !newCustomer) {
                console.error('Error creating customer profile:', createError);
                return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
            }
            customerId = newCustomer.id;
            isNewCustomer = true;
        }

        // Create address if provided
        if (address && isNewCustomer) {
            try {
                await adminClient
                    .from('addresses')
                    .insert({
                        user_id: customerId,
                        street_address: address,
                        city: city || '',
                        country: 'CO',
                        location: latitude && longitude ? {
                            lat: Number(latitude),
                            lng: Number(longitude)
                        } : null,
                        is_default: true
                    } as any);
            } catch (addressError) {
                console.error('Error creating address:', addressError);
            }
        }

        // Create customer relationship with distributor
        const { data: relationship, error: relError } = await adminClient
            .from('customer_relationships')
            .insert({
                customer_id: customerId,
                distributor_id: distributor.id,
                status: 'active',
                credit_limit: credit_limit ? parseFloat(credit_limit) : 0
            })
            .select()
            .single();

        if (relError || !relationship) {
            console.error('Error creating customer relationship:', relError);
            return NextResponse.json({ error: 'Failed to link customer to distributor' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            customer: {
                id: customerId,
                full_name,
                phone,
                email,
                relationship_id: relationship.id,
                credit_limit: relationship.credit_limit
            }
        });

    } catch (error) {
        console.error('Create Customer API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
