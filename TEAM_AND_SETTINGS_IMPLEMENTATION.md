# Team Management and Settings Implementation

## Overview
This document describes the implementation of the team management (drivers) and store settings features for the LogiMapProd dashboard.

## Mission A: Team Management (Drivers)

### Route: `/dashboard/[slug]/team`

### Features Implemented

#### 1. Team Members List
- Displays all team members linked to the distributor
- Shows member information including:
  - Name and avatar
  - Role (Driver, Admin, Warehouse)
  - Email and phone
  - Hire date
  - Employee code
  - Active status
- Responsive grid layout with cards for each member

#### 2. Create/Invite Driver Form
- Fields:
  - Full Name (required)
  - Email (required)
  - Role (Select: driver, admin, warehouse)
- Backend Logic:
  - Creates user in Supabase Auth with temporary password
  - Creates profile in `profiles` table
  - Links user to distributor in `distributor_users` table
  - Returns temporary password for testing (should be sent via email in production)

#### 3. API Routes

**GET `/api/dashboard/[slug]/team`**
- Fetches all team members for a distributor
- Returns member data with profile information
- Requires authentication and distributor access

**POST `/api/dashboard/[slug]/team`**
- Creates a new team member
- Validates input (name, email, role)
- Checks for duplicate emails
- Creates auth user, profile, and distributor link
- Returns temporary password (for testing)

### Files Created
- `app/(dashboard)/dashboard/[slug]/team/page.tsx` - Team management UI
- `app/api/dashboard/[slug]/team/route.ts` - Team API endpoints

### Files Modified
- `app/(dashboard)/dashboard/[slug]/layout.tsx` - Updated menu item to point to `/team` instead of `/drivers`

## Mission B: Store Settings

### Route: `/dashboard/[slug]/settings`

### Features Implemented

#### 1. Basic Information Form
- Store Name (required)
- WhatsApp Phone Number
- Logo URL with preview
- Theme Color with color picker and preview

#### 2. Delivery Zones Configuration
- JSON-based configuration for delivery zones
- Textarea for editing JSON
- JSON validation before saving
- Example structure provided

#### 3. API Routes

**GET `/api/dashboard/[slug]/settings`**
- Fetches current distributor settings
- Returns all distributor data

**PATCH `/api/dashboard/[slug]/settings`**
- Updates distributor settings
- Supports partial updates (only provided fields)
- Validates JSON for delivery zones
- Updates `distributors` table

### Files Created
- `app/(dashboard)/dashboard/[slug]/settings/page.tsx` - Settings UI
- `app/api/dashboard/[slug]/settings/route.ts` - Settings API endpoints

## Database Schema Used

### distributor_users Table
```typescript
{
  id: string;
  user_id: string; // FK to profiles
  distributor_id: string; // FK to distributors
  role: string; // 'driver', 'admin', 'warehouse'
  is_active: boolean;
  employee_code: string | null;
  hire_date: string | null;
  permissions: Json | null;
  created_at: string;
  updated_at: string;
}
```

### distributors Table
```typescript
{
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  logo_url: string | null;
  settings: Json | null; // Contains theme_color
  delivery_zones: Json | null;
  // ... other fields
}
```

### profiles Table
```typescript
{
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  // ... other fields
}
```

## Testing Instructions

### Team Management
1. Navigate to `/dashboard/[slug]/team`
2. Click "Agregar Miembro"
3. Fill in the form:
   - Name: Test Driver
   - Email: test@example.com
   - Role: Chofer
4. Click "Crear Miembro"
5. Verify the member appears in the list
6. Note the temporary password displayed
7. Test login with the new user credentials

### Settings
1. Navigate to `/dashboard/[slug]/settings`
2. Update store name
3. Add WhatsApp phone number
4. Change theme color (use color picker or hex code)
5. Add logo URL
6. Configure delivery zones (JSON format)
7. Click "Guardar Cambios"
8. Verify changes persist

## Future Enhancements

### Team Management
- [ ] Send email with temporary password using Resend
- [ ] Edit existing team members
- [ ] Delete/deactivate team members
- [ ] Bulk import team members
- [ ] Assign permissions per role
- [ ] View team member activity logs

### Settings
- [ ] Logo upload functionality
- [ ] Visual map editor for delivery zones
- [ ] Business hours configuration
- [ ] Tax settings
- [ ] Payment method configuration
- [ ] Notification preferences

## Security Considerations

1. **Authentication**: All API routes require authentication
2. **Authorization**: Users can only access their own distributor's data
3. **Password Security**: Temporary passwords should be sent via email, not displayed
4. **Input Validation**: All inputs are validated before processing
5. **SQL Injection**: Using Supabase client with parameterized queries

## Notes

- The temporary password is currently displayed in the UI for testing purposes
- In production, implement email sending using Resend or similar service
- Delivery zones use JSON format for flexibility; consider a visual editor in the future
- Theme color is stored in the `settings` JSON field of the distributors table
