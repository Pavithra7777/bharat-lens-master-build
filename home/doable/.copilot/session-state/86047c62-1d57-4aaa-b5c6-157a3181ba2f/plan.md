# Bharat Lens - Supabase Migration Fixes Plan

## Problem
App migrated from PGlite to Supabase but has multiple runtime errors: DB column mismatches, missing filter UI, function signature bugs, and console error spam.

## Status: Fixes Complete, Awaiting Migration Run

### Done ✅
1. **Supabase URL validation** - `val.startsWith('http')` check, fallback to hardcoded URL
2. **Blank page / Get Started disabled** - AppContext catch block now creates fallback profile
3. **PGRST205 console spam** - `safeError()` helper suppresses "table not found" errors
4. **Missing Filter UI** - Added filter toggle button, panel with Gender/State/Income/Age filters
5. **Category pill selection logic** - Fixed unreachable branch in displayedSchemes
6. **`getSchemes(state)` wrong column** - Fixed `state.ilike` → `applicable_states.cs.{state}`
7. **`searchSchemes` wrong column** - Fixed `name` → `title`
8. **FamilyPage `getFamilyGroupByOwner()`** - Added missing `ownerId` argument
9. **`HomePage.getSchemes(6)`** - Fixed number → string state parameter
10. **FamilyGroup `name` → DB `group_name`** - Added mapping in `addFamilyGroup`
11. **FamilyMember column mapping** - `group_id`→`family_group_id`, `name`→`display_name`, `relationship`→`relation` in `addFamilyMember` and `getFamilyMembers`
12. **Document column mapping** - `addDocument` and `getDocuments` now map interface fields to DB columns
13. **Scheme DB→interface mapping** - `getSchemes`, `searchSchemes`, `getSchemeById` map `title`→`name`, `short_benefit`→`benefits`, `application_mode`→`how_to_apply`
14. **`addFamilyGroup` missing `owner_id`** - Was missing in insert object

### Blocked ⏳
**Run Supabase migration** - User must paste `supabase_migration.sql` into SQL Editor at:
`https://supabase.com/dashboard/project/uvtedewjjkulnkthwcmk/sql`

### Not Yet Tested
- Full auth → onboarding → home → schemes → scheme detail flow
- Filter panel actual filtering behavior (needs DB data)
- Chat, Vault, Reminders, Applications, Scan, Family, Scam, Settings pages
- FamilyPage `addFamilyGroup` with `owner_id`
- `addLiveSchemeUpdate` live update feature
- TypeScript strict errors (~20 remain, non-blocking)

### Key Fix Details

**DB column mapping approach**: Rather than changing the UI code (which uses interface field names), the DB helper functions map DB columns to interface fields. This is cleaner and less error-prone.

**`safeError()` pattern**: All `console.error` calls in DB helpers now go through `safeError(error)` which checks `error?.code !== 'PGRST205'` before logging. Keeps console clean while surfacing unexpected errors.

**RLS setup**: Uses `app.user_id` PostgreSQL setting set by platform auth layer. All tables use `INSERT WITH CHECK (true)` for public inserts and owner-scoped UPDATE/DELETE.
