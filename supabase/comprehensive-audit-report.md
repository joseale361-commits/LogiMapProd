# 🔍 Supabase Audit Report - LogiMapProd

**Date:** 2026-02-11  
**Auditor:** Supabase + Database-Design Skills  
**Status:** Complete Analysis

---

## 📋 Executive Summary

Based on applying Supabase Best Practices (`supabase-postgres-best-practices/`) and Database Design principles (`database-design/`), this report identifies critical issues, schema concerns, and code patterns that could fail or compromise functionality.

---

## 🔴 CRITICAL ISSUES

### 1. RLS Policy Column Mismatch - `addresses` table

**File:** `setup-addresses-rls.sql:18`

**Problem:** RLS policy uses `customer_id` but the table schema shows `user_id`.

```sql
-- INCORRECT (what's currently in setup-addresses-rls.sql)
CREATE POLICY ... USING (auth.uid() = customer_id);

-- CORRECT (based on types/supabase.ts line 33)
CREATE POLICY ... USING (auth.uid() = user_id);
```

**Impact:** RLS policies silently fail, potentially exposing all addresses to unauthorized users.

**Fix:** Execute `supabase/fix-addresses-rls-corrected.sql`

---

### 2. Missing Indexes on Foreign Keys

**Problem:** Multiple FK columns lack indexes, causing sequential scans.

**Affected Tables:**
| Table | Missing Index | Impact |
|-------|--------------|--------|
| `orders` | `distributor_id`, `customer_id` | CRITICAL |
| `route_stops` | `route_id`, `order_id` | CRITICAL |
| `distributor_users` | `user_id`, `distributor_id` | HIGH |
| `customer_relationships` | `customer_id`, `distributor_id` | HIGH |

**Fix:** Execute `supabase/create-indexes-optimization.sql`

---

## 🟠 HIGH PRIORITY ISSUES

### 3. Schema Design: Profiles Table Missing Relationships

**File:** `types/supabase.ts:720-776`

**Problem:** The `profiles` table has no defined relationships in the schema, but it's referenced by:
- `orders` (customer_id, approved_by, cancelled_by, delivered_by)
- `route_stops` (delivered_by)
- `routes` (created_by, driver_id)
- `distributor_users` (user_id)

**Impact:** TypeScript relationships don't work, ORM can't infer joins, potential data integrity issues.

**Recommendation:** Add relationships to the schema or document the expected foreign keys.

---

### 4. Inconsistent ID Naming Convention

**Issue:** Mixed naming conventions across schema:

| Table | ID Column | Expected Pattern |
|-------|-----------|------------------|
| `profiles` | `id` + `auth_user_id` | Confusing (both UUIDs) |
| `distributor_users` | `user_id` | References `profiles.id` |
| `orders` | `customer_id` | References `profiles.id` |

**Best Practice:** Use consistent naming:
- `profiles.id` should be the primary key
- All references should be `profile_id` (not `user_id` or `customer_id`)

---

### 5. N+1 Query Pattern in Middleware

**File:** `middleware.ts:48-54`

```typescript
// This query runs on EVERY authenticated request
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('user_id', user.id)
  .single();
```

**Impact:** Extra database round trip on every request.

**Fix:** Cache profile check in session or use Supabase's session data.

---

## 🟡 MEDIUM PRIORITY ISSUES

### 6. Missing ON DELETE Constraints on Foreign Keys

**Observation:** Cannot verify from types, but RLS policies suggest potential orphan data issues.

**Recommended Constraints:**
```sql
-- For orders -> profiles (customer_id)
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_customer_id_fkey,
  ADD CONSTRAINT orders_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES profiles(id) 
  ON DELETE SET NULL;

-- For route_stops -> orders
ALTER TABLE route_stops
  DROP CONSTRAINT IF EXISTS route_stops_order_id_fkey,
  ADD CONSTRAINT route_stops_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(id)
  ON DELETE CASCADE;
```

---

### 7. JSONB Columns Without GIN Indexes

**Tables with JSON columns:**
- `addresses.location`
- `orders.delivery_location`
- `orders.delivery_address_snapshot`
- `products.attributes`, `products.images`, `products.tags`
- `product_variants.attributes`
- `profiles.preferences`
- `distributors.delivery_zones`, `distributors.settings`
- `routes.optimized_path`

**Issue:** Querying JSONB columns without GIN indexes is slow.

**Fix:**
```sql
CREATE INDEX idx_orders_delivery_location ON orders USING GIN (delivery_location jsonb_path_ops);
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);
```

---

### 8. Code Pattern: Type Casting with `as any`

**File:** `lib/queries/orders.ts:36-37`

```typescript
const { data: order, error } = await (supabase
    .from('orders') as any)
```

**Impact:** Bypasses TypeScript type checking, hides schema errors.

**Fix:** Use proper generic types:
```typescript
const { data: order, error } = await supabase
    .from('orders')
    .select(`..., distributors(name, phone), ...`)
    .eq('id', orderId)
    .single();
```

---

## 🟢 LOW PRIORITY / OBSERVATIONS

### 9. RLS Optimization Already Applied

**Good News:** The `optimize-rls-policies.sql` file already uses the optimized pattern:
```sql
-- Correct pattern (InitPlan optimization)
CREATE POLICY ... USING (
    distributor_id IN (
        SELECT distributor_id
        FROM user_distributors
        WHERE user_id = (SELECT auth.uid())
    )
);
```

This follows Supabase best practices to prevent auth.uid() re-evaluation per row.

---

### 10. Geometry Columns May Need GiST Indexes

**Location columns (PostGIS):**
- `addresses.location`
- `orders.delivery_location`
- `routes.optimized_path`

**Fix:**
```sql
CREATE INDEX idx_addresses_location_gist ON addresses USING GIST (location);
CREATE INDEX idx_orders_delivery_location_gist ON orders USING GIST (delivery_location);
```

---

### 11. Missing Timestamps on Some Tables

**Check:** Ensure all tables have:
- `created_at` ✅ (Most tables have it)
- `updated_at` ✅ (Most tables have it)
- `deleted_at` (for soft deletes if needed)

---

## 📊 Code Patterns Analysis

### ✅ What's Correct

1. **Middleware Authentication Flow** - Properly implemented with session refresh
2. **RLS Service Role Bypass** - Correct for admin operations
3. **React.cache() Usage** - Prevents duplicate Supabase connections
4. **Eager Loading with Joins** - `lib/queries/orders.ts` uses proper JOINs instead of N+1

### ❌ What Needs Fixing

1. **`SELECT *` usage** (anti-pattern) - Use explicit column lists
2. **`as any` type casting** - Bypasses type safety
3. **Missing error handling** - Some queries don't handle null returns gracefully

---

## 📁 Files to Apply

| File | Purpose | Priority |
|------|---------|----------|
| `supabase/fix-addresses-rls-corrected.sql` | Fix RLS addresses | CRITICAL |
| `supabase/create-indexes-optimization.sql` | Add missing indexes | HIGH |
| `supabase/audit-verification.sql` | Verify current state | LOW |

---

## 🎯 Recommendations Summary

1. **Immediate:** Fix addresses RLS policy
2. **High:** Add indexes to FK columns
3. **Medium:** Review and fix foreign key constraints
4. **Ongoing:** Replace `as any` with proper types

---

**End of Report**
