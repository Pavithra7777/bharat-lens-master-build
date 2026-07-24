import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, detectSessionInUrl: false },
    })
  : null;

export interface MigrationResult {
  success: boolean;
  migrated: number;
  failed: number;
  errors: string[];
}

export async function migrateSchemes(schemes: any[]): Promise<MigrationResult> {
  if (!supabase) {
    return { success: false, migrated: 0, failed: schemes.length, errors: ['Supabase not configured'] };
  }

  const result: MigrationResult = { success: true, migrated: 0, failed: 0, errors: [] };

  // Insert schemes in batches of 50
  const batchSize = 50;
  for (let i = 0; i < schemes.length; i += batchSize) {
    const batch = schemes.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('schemes')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      result.failed += batch.length;
      result.errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
    } else {
      result.migrated += batch.length;
    }
  }

  result.success = result.failed === 0;
  return result;
}

export async function migrateProfiles(profiles: any[]): Promise<MigrationResult> {
  if (!supabase) {
    return { success: false, migrated: 0, failed: profiles.length, errors: ['Supabase not configured'] };
  }

  const result: MigrationResult = { success: true, migrated: 0, failed: 0, errors: [] };

  const { error } = await supabase
    .from('profiles')
    .upsert(profiles, { onConflict: 'id' });

  if (error) {
    result.failed = profiles.length;
    result.errors.push(error.message);
    result.success = false;
  } else {
    result.migrated = profiles.length;
  }

  return result;
}

export async function migrateVaultItems(items: any[]): Promise<MigrationResult> {
  if (!supabase) {
    return { success: false, migrated: 0, failed: items.length, errors: ['Supabase not configured'] };
  }

  const result: MigrationResult = { success: true, migrated: 0, failed: 0, errors: [] };

  // Insert vault items
  for (const item of items) {
    const { error } = await supabase
      .from('vault_items')
      .insert({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        metadata: item.metadata,
        item_type: item.item_type,
        created_at: item.created_at,
      });

    if (error) {
      result.failed++;
      result.errors.push(`Vault item ${item.id}: ${error.message}`);
    } else {
      result.migrated++;
    }
  }

  result.success = result.failed === 0;
  return result;
}

export async function migrateFamilyGroups(groups: any[]): Promise<MigrationResult> {
  if (!supabase) {
    return { success: false, migrated: 0, failed: groups.length, errors: ['Supabase not configured'] };
  }

  const result: MigrationResult = { success: true, migrated: 0, failed: 0, errors: [] };

  const { error } = await supabase
    .from('family_groups')
    .upsert(groups, { onConflict: 'id' });

  if (error) {
    result.failed = groups.length;
    result.errors.push(error.message);
    result.success = false;
  } else {
    result.migrated = groups.length;
  }

  return result;
}

export async function migrateFamilyMembers(members: any[]): Promise<MigrationResult> {
  if (!supabase) {
    return { success: false, migrated: 0, failed: members.length, errors: ['Supabase not configured'] };
  }

  const result: MigrationResult = { success: true, migrated: 0, failed: 0, errors: [] };

  const { error } = await supabase
    .from('family_members')
    .upsert(members, { onConflict: 'id' });

  if (error) {
    result.failed = members.length;
    result.errors.push(error.message);
    result.success = false;
  } else {
    result.migrated = members.length;
  }

  return result;
}

export async function migrateReminders(reminders: any[]): Promise<MigrationResult> {
  if (!supabase) {
    return { success: false, migrated: 0, failed: reminders.length, errors: ['Supabase not configured'] };
  }

  const result: MigrationResult = { success: true, migrated: 0, failed: 0, errors: [] };

  for (const reminder of reminders) {
    const { error } = await supabase
      .from('reminders')
      .insert({
        id: reminder.id,
        title: reminder.title,
        due_date: reminder.due_date,
        notify_via: reminder.notify_via,
        is_completed: reminder.is_completed,
        owner_id: reminder.owner_id,
        related_document_id: reminder.related_document_id,
        related_application_id: reminder.related_application_id,
        created_at: reminder.created_at,
      });

    if (error) {
      result.failed++;
      result.errors.push(`Reminder ${reminder.id}: ${error.message}`);
    } else {
      result.migrated++;
    }
  }

  result.success = result.failed === 0;
  return result;
}

export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabase) return false;
  
  try {
    const { error } = await supabase.from('schemes').select('count', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}

export async function checkSupabaseTablesExist(): Promise<{
  schemes: boolean;
  profiles: boolean;
  vault_items: boolean;
}> {
  if (!supabase) {
    return { schemes: false, profiles: false, vault_items: false };
  }

  const results = await Promise.all([
    supabase.from('schemes').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('vault_items').select('id', { count: 'exact', head: true }),
  ]);

  return {
    schemes: !results[0].error,
    profiles: !results[1].error,
    vault_items: !results[2].error,
  };
}
