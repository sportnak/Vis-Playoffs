# Player Position Migration Guide

This guide walks through migrating from boolean position columns (`is_qb`, `is_rb`, `is_wr`, `is_te`) to a single `position` enum column.

## Overview

The migration involves:
1. Adding a new `position` enum column
2. Migrating existing data
3. Updating application code
4. Removing old boolean columns

## Migration Steps

### Step 1: Run the Initial Migration

Run the first migration to add the position enum and migrate data:

```bash
supabase migration up 20251225000000_migrate_player_positions_to_enum.sql
```

Or if using the Supabase CLI:

```bash
supabase db push
```

This migration:
- Creates the `player_position` enum type with values: 'QB', 'RB', 'WR', 'TE'
- Adds a `position` column to the `player` table
- Migrates all existing data from boolean columns to the enum
- Adds an index on the position column
- **Does NOT** drop the old columns yet (for safety)

### Step 2: Verify the Migration

Check that all players have a position assigned:

```sql
-- Check for any NULL positions
SELECT COUNT(*) FROM player WHERE position IS NULL;

-- Verify data looks correct
SELECT id, name, position, is_qb, is_rb, is_wr, is_te
FROM player
LIMIT 100;

-- Compare counts
SELECT
    COUNT(*) FILTER (WHERE position = 'QB') as position_qb,
    COUNT(*) FILTER (WHERE is_qb = true) as boolean_qb,
    COUNT(*) FILTER (WHERE position = 'RB') as position_rb,
    COUNT(*) FILTER (WHERE is_rb = true) as boolean_rb,
    COUNT(*) FILTER (WHERE position = 'WR') as position_wr,
    COUNT(*) FILTER (WHERE is_wr = true) as boolean_wr,
    COUNT(*) FILTER (WHERE position = 'TE') as position_te,
    COUNT(*) FILTER (WHERE is_te = true) as boolean_te
FROM player;
```

### Step 3: Update Application Code (Optional - Already Compatible)

The application code has been updated to support both the old and new formats using helper functions in `utils/player-position.ts`.

Key changes:
- `app/types.ts` - Updated Player interface to include both `position` and legacy boolean fields
- `utils/player-position.ts` - Helper functions that work with both formats

### Step 4: Update Code to Use Position Enum (Recommended)

While the helper functions support both formats, you should update code to use the new position field directly:

**Before:**
```typescript
if (player.is_qb) { ... }
if (player.is_rb || player.is_wr || player.is_te) { ... }
```

**After:**
```typescript
import { getPlayerPosition, isFlexEligible } from '@/utils/player-position';

if (getPlayerPosition(player) === 'QB') { ... }
if (isFlexEligible(player)) { ... }
```

**Or using the position directly (after cleanup migration):**
```typescript
if (player.position === 'QB') { ... }
```

### Step 5: Update Database Queries

Update any database queries that use the boolean columns:

**Before:**
```typescript
request.is('is_qb', true);
request.or('is_te.is.true, is_rb.is.true, is_wr.is.true');
```

**After:**
```typescript
request.eq('position', 'QB');
request.in('position', ['TE', 'RB', 'WR']);
```

Key files to update:
- `actions/league.ts` - `loadNFLPlayers()` function
- Any other files that query players by position

### Step 6: Test Thoroughly

Test all functionality that uses player positions:
- Draft functionality
- Player filtering by position
- Team roster validation
- Scoring calculations

### Step 7: Run the Cleanup Migration

After verifying everything works with the new position column, run the cleanup migration:

```bash
supabase migration up 20251225000001_cleanup_old_position_columns.sql
```

This migration:
- Makes the `position` column NOT NULL
- Drops the old boolean columns (`is_qb`, `is_rb`, `is_wr`, `is_te`)

### Step 8: Final Code Cleanup

After the cleanup migration is complete, you can:
1. Remove the optional `?` from the `position` field in `app/types.ts`
2. Remove the deprecated boolean fields from the Player interface
3. Simplify code to use `player.position` directly instead of helper functions

## Benefits of This Migration

1. **Cleaner data model**: Single column instead of 4 booleans
2. **Type safety**: Enum ensures only valid positions
3. **Better performance**: Single indexed column vs 4 boolean columns
4. **Easier to extend**: Adding new positions (e.g., 'K', 'DEF') is simpler
5. **Simpler queries**: `position = 'QB'` vs `is_qb = true`

## Rollback Instructions

If you need to rollback:

### After Step 1 (before cleanup):
```sql
-- Just drop the new column and type
ALTER TABLE public.player DROP COLUMN position;
DROP TYPE IF EXISTS player_position;
```

### After Step 7 (after cleanup):
Run the rollback SQL included in the cleanup migration file.

## Helper Functions Reference

The migration includes helper functions in `utils/player-position.ts`:

- `getPlayerPosition(player)` - Get position (supports both formats)
- `isPlayerPosition(player, position)` - Check if player is a specific position
- `isFlexEligible(player)` - Check if player can fill FLEX spot
- `isSuperFlexEligible(player)` - Check if player can fill SF spot
- `filterByPosition(players, position)` - Filter players by position
- `countByPosition(players, position)` - Count players of a position
