# Plan: Fix Next.js 15+ Cookie Error & Apply Best Practices

## 📋 Executive Summary

**Critical Issue:** `cookieStore.get is not a function` error causing server crash in Next.js 16.1.6

**Root Cause:** In Next.js 15+, the `cookies()` function returns a Promise that must be awaited. The current code correctly awaits `cookies()`, but the way the cookieStore is passed to `@supabase/ssr`'s `createServerClient` may not be compatible with the latest version.

**Solution:** Create a reusable Supabase server client utility and refactor both files to follow Next.js 15+ best practices.

---

## 🔍 Analysis

### Current State

**File:** `app/(dashboard)/dashboard/[slug]/layout.tsx`
```typescript
const cookieStore = await cookies();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  }
);
```

**Problem:** The `cookieStore.get()` method in Next.js 15+ returns a `RequestCookie` object, not a string. The `createServerClient` expects the `get` method to return the cookie value directly.

### Dependencies
- Next.js: 16.1.6
- @supabase/ssr: 0.8.0
- React: 19.2.3

---

## 🎯 Solution Architecture

### 1. Create Reusable Supabase Server Client Utility

**File:** `lib/supabase/server.ts`

**Purpose:** Centralize Supabase client creation with proper Next.js 15+ cookie handling.

**Key Features:**
- Use `React.cache()` for per-request deduplication (Rule 3.6 from nextjs-react-expert)
- Proper error handling for missing environment variables
- Type-safe cookie access
- Reusable across all server components

### 2. Refactor layout.tsx

**Improvements:**
- Use the new `createSupabaseServerClient()` utility
- Apply guard clauses for early returns (clean-code principle)
- Extract menu items to constant
- Improve error handling with specific redirect paths
- Add proper TypeScript types

### 3. Refactor page.tsx

**Improvements:**
- Use the new `createSupabaseServerClient()` utility
- Apply guard clauses
- Improve error handling
- Extract card data to constants for maintainability

---

## 📐 Technical Implementation Details

### Cookie Handling Pattern (Next.js 15+)

```typescript
// ✅ CORRECT: Next.js 15+ pattern
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const cookieStore = await cookies();

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  }
);
```

### React.cache() for Deduplication

```typescript
import { cache } from 'react';

export const createSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies();
  // ... client creation
});
```

This ensures that within a single request, multiple calls to `createSupabaseServerClient()` return the same instance, avoiding duplicate database connections.

---

## 📊 Best Practices Applied

### From clean-code Skill
- **SRP (Single Responsibility):** Extract Supabase client creation to utility
- **DRY (Don't Repeat Yourself):** Reuse client creation across files
- **Guard Clauses:** Early returns for error conditions
- **Flat > Nested:** Avoid deep nesting

### From nextjs-react-expert Skill
- **Rule 3.6:** Use `React.cache()` for per-request deduplication
- **Rule 3.1:** Authenticate server components properly
- **Rule 3.4:** Minimize serialization at RSC boundaries

### From frontend-specialist Agent
- **Type Safety:** Proper TypeScript types throughout
- **Error Handling:** Graceful error states and redirects
- **Performance:** Server Components by default

---

## 🔄 Migration Steps

1. **Create** `lib/supabase/server.ts` with reusable client
2. **Rewrite** `app/(dashboard)/dashboard/[slug]/layout.tsx`
3. **Rewrite** `app/(dashboard)/dashboard/[slug]/page.tsx`
4. **Test** to verify server crash is resolved

---

## 📁 File Structure After Changes

```
lib/
├── supabase/
│   ├── admin.ts       (existing)
│   ├── client.ts      (existing)
│   └── server.ts      (NEW - reusable server client)
app/(dashboard)/dashboard/[slug]/
├── layout.tsx         (REFACTORED)
└── page.tsx          (REFACTORED)
```

---

## ✅ Success Criteria

- [ ] Server starts without `cookieStore.get is not a function` error
- [ ] Dashboard layout renders correctly
- [ ] Dashboard page renders correctly
- [ ] Authentication still works (redirects to /login if not authenticated)
- [ ] Authorization still works (redirects to /unauthorized if no access)
- [ ] TypeScript compilation passes
- [ ] ESLint passes

---

## 🚨 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing auth flow | Keep same redirect logic, only change client creation |
| Type errors | Use proper TypeScript types from Database schema |
| Performance regression | Use React.cache() to prevent duplicate connections |
| Environment variable issues | Add proper error handling for missing vars |

---

## 📝 Notes

- The `@supabase/ssr` v0.8.0 expects a `cookies` object with `getAll()` and `setAll()` methods, not just `get()`
- Next.js 15+ requires `await cookies()` before accessing cookies
- Using `React.cache()` is critical for performance in Next.js 15+ to avoid duplicate database queries within the same request
