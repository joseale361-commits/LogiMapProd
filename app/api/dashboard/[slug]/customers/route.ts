import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, getDistributorBySlug } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

interface CustomerOrder {
    id: string;
    customer_id: string;
    created_at: string;
    status: string;
    total_amount: number;
}

interface CustomerAddress {
    id: string;
    street_address: string;
    city: string;
    location: any;
    is_default: boolean;
}

interface CustomerProfile {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    created_at: string;
    addresses: CustomerAddress[];
}

interface CustomerRelationship {
    id: string;
    customer_id: string;
    distributor_id: string;
    status: string | null;
    credit_limit: number | null;
    current_debt: number;
    customer: CustomerProfile;
}

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { slug } = await params;
        const searchParams = request.nextUrl.searchParams;
        const filter = searchParams.get('filter') || 'all';

        const supabase = await createClient();
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const distributor = await getDistributorBySlug(slug);
        if (!distributor) return NextResponse.json({ error: 'Distributor not found' }, { status: 404 });

        // Fetch customer relationships for this distributor
        const { data: customerRelationships, error: crError } = await adminClient
            .from('customer_relationships')
            .select(`
                *,
                customer:profiles!customer_id (
                    id,
                    full_name,
                    email,
                    phone,
                    created_at,
                    addresses (
                        id,
                        street_address,
                        city,
                        location,
                        is_default
                    )
                )
            `)
            .eq('distributor_id', distributor.id)
            .eq('status', 'active');

        if (crError) throw crError;

        // Get all orders for this distributor to calculate purchase metrics
        const { data: orders, error: ordersError } = await adminClient
            .from('orders')
            .select('id, customer_id, created_at, status, total_amount')
            .eq('distributor_id', distributor.id)
            .in('status', ['delivered', 'completed']);

        if (ordersError) throw ordersError;

        // Process customer data with purchase metrics
        const customers = customerRelationships.map((relationship: CustomerRelationship) => {
            const customer = relationship.customer;
            const customerOrders = (orders as CustomerOrder[])?.filter((o: CustomerOrder) => o.customer_id === customer.id) || [];

            // Sort orders by date descending
            customerOrders.sort((a: CustomerOrder, b: CustomerOrder) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const lastOrder = customerOrders[0] || null;
            const orderCount = customerOrders.length;

            // Calculate purchase frequency (average days between orders)
            let purchaseFrequency: number | null = null;
            if (orderCount > 1) {
                const totalDays = (new Date(customerOrders[0].created_at).getTime() - new Date(customerOrders[customerOrders.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24);
                purchaseFrequency = Math.round(totalDays / (orderCount - 1));
            }

            // Determine customer status based on last purchase
            let status: 'active-7' | 'active-15' | 'inactive-30' | 'inactive' = 'inactive';
            let daysSinceLastOrder: number | null = null;

            if (lastOrder) {
                const lastOrderDate = new Date(lastOrder.created_at);
                const daysDiff = Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
                daysSinceLastOrder = daysDiff;

                if (daysDiff <= 7) {
                    status = 'active-7';
                } else if (daysDiff <= 15) {
                    status = 'active-15';
                } else if (daysDiff <= 30) {
                    status = 'inactive-30';
                } else {
                    status = 'inactive';
                }
            }

            // Get default address with location
            const defaultAddress = customer.addresses?.find((addr: any) => addr.is_default) || customer.addresses?.[0];

            // Safely extract location with comprehensive null checks
            let location = null;
            if (defaultAddress?.location) {
                const lat = defaultAddress.location.lat ?? defaultAddress.location.latitude;
                const lng = defaultAddress.location.lng ?? defaultAddress.location.longitude;

                // Validate coordinates
                if (lat !== null && lat !== undefined &&
                    lng !== null && lng !== undefined &&
                    !isNaN(Number(lat)) && !isNaN(Number(lng))) {
                    location = {
                        lat: Number(lat),
                        lng: Number(lng)
                    };
                }
            }

            return {
                id: customer.id,
                full_name: customer.full_name,
                email: customer.email,
                phone: customer.phone,
                relationship_id: relationship.id,
                credit_limit: relationship.credit_limit,
                current_debt: relationship.current_debt,
                status: relationship.status,
                last_order_id: lastOrder?.id || null,
                last_order_date: lastOrder?.created_at || null,
                last_order_amount: lastOrder?.total_amount || null,
                days_since_last_order: daysSinceLastOrder,
                purchase_frequency: purchaseFrequency,
                total_orders: orderCount,
                address: defaultAddress ? {
                    street_address: defaultAddress.street_address,
                    city: defaultAddress.city,
                    location: location
                } : null,
                pin_status: status
            };
        });

        // Filter by status if needed
        let filteredCustomers = customers;
        if (filter === 'inactive') {
            filteredCustomers = customers.filter((c: any) => c.pin_status === 'inactive-30' || c.pin_status === 'inactive');
        }

        // Separate customers with and without location for map
        const customersWithLocation = filteredCustomers.filter((c: any) => c.address?.location?.lat && c.address?.location?.lng);
        const customersWithoutLocation = filteredCustomers.filter((c: any) => !c.address?.location?.lat || !c.address?.location?.lng);

        return NextResponse.json({
            success: true,
            customers: filteredCustomers,
            customersWithLocation,
            customersWithoutLocation,
            summary: {
                total: filteredCustomers.length,
                active7: filteredCustomers.filter((c: any) => c.pin_status === 'active-7').length,
                active15: filteredCustomers.filter((c: any) => c.pin_status === 'active-15').length,
                inactive30: filteredCustomers.filter((c: any) => c.pin_status === 'inactive-30').length,
                inactive: filteredCustomers.filter((c: any) => c.pin_status === 'inactive').length,
                withoutLocation: customersWithoutLocation.length
            }
        });

    } catch (error) {
        console.error('Customers List API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
