# SPEC-02: Magic Link Auth + Profile Bootstrap

## Objective
Enable passwordless email authentication (magic links) and auto-create `profiles` row on first sign-in.

## Acceptance Criteria
- [ ] User clicks "Send Magic Link" → receives email → clicks link → lands on dashboard
- [ ] `profiles` row created automatically with:
  - `id` = auth user ID
  - `full_name` = email prefix (before @)
  - `role` = 'gate' (default)
  - `plant_id` = NULL (admin assigns later)
- [ ] Session persists across browser restarts
- [ ] Logout works, redirects to login
- [ ] No password UI anywhere

## Dependencies
- SPEC-01 complete (schema run, `profiles` table exists)
- Supabase Auth email provider enabled

## Implementation

### 1. Supabase Dashboard Config
```
Authentication → Providers → Email
  ✅ Enable "Confirm email"
  ✅ Enable "Email OTP" (optional, alternative to magic link)

Authentication → URL Configuration
  Site URL: https://your-project.pages.dev
  Redirect URLs:
    - https://your-project.pages.dev/**
    - http://localhost:3000/**
```

### 2. Database Trigger (Run in SQL Editor)
```sql
-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'gate'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Frontend (Already in `App.tsx`)
- `AuthPage` component: email input → `supabase.auth.signInWithOtp()`
- `Dashboard` component: `supabase.auth.getSession()` + `onAuthStateChange` listener
- Logout: `supabase.auth.signOut()`

## Evidence (Records)
- Screenshot: Magic link email received
- Screenshot: Dashboard loaded after click
- Supabase Dashboard → Authentication → Users: new user visible
- Supabase Dashboard → Table Editor → `profiles`: row auto-created

## Handoff Artifact
Test flow:
1. Open deployed URL in incognito
2. Enter email → click "Send Magic Link"
3. Check email → click link
4. Verify: dashboard loads, no errors in console
5. Check `profiles` table → row exists with correct role

## Next Spec
→ `SPECS/03-crud-visits.md` — Truck visit CRUD + realtime sync

---

## Rationale
Magic links = zero password management, no "forgot password" flow, secure by default. Perfect for internal team with company emails.

## Out of Scope
- Social login (Google, GitHub)
- MFA (add later if compliance requires)
- Admin user management UI (SPEC-08)