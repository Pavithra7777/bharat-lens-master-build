import { useState, useEffect } from 'react';
import { Link } from '../lib/Router';
import { Database, ArrowRight, Check, X, AlertCircle, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { db } from '@doable/data';
import {
  checkSupabaseConnection,
  checkSupabaseTablesExist,
  migrateSchemes,
  migrateProfiles,
  migrateVaultItems,
  migrateFamilyGroups,
  migrateFamilyMembers,
  migrateReminders,
} from '../lib/DataMigration';

interface DataCounts {
  schemes: number;
  profiles: number;
  vault_items: number;
  family_groups: number;
  family_members: number;
  reminders: number;
}

interface MigrationStatus {
  status: 'idle' | 'checking' | 'migrating' | 'done' | 'error';
  message: string;
  details?: any;
}

export function MigrationPage() {
  const [currentDbCounts, setCurrentDbCounts] = useState<DataCounts | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [tablesReady, setTablesReady] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({ status: 'idle', message: '' });
  const [migrationResults, setMigrationResults] = useState<any>({});

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setMigrationStatus({ status: 'checking', message: 'Checking database status...' });

    const counts: DataCounts = { schemes: 0, profiles: 0, vault_items: 0, family_groups: 0, family_members: 0, reminders: 0 };
    
    try {
      const [s, p, v, fg, fm, r] = await Promise.all([
        db.query<{ count: number }>('SELECT COUNT(*) as count FROM schemes'),
        db.query<{ count: number }>('SELECT COUNT(*) as count FROM profiles'),
        db.query<{ count: number }>('SELECT COUNT(*) as count FROM vault_items'),
        db.query<{ count: number }>('SELECT COUNT(*) as count FROM family_groups'),
        db.query<{ count: number }>('SELECT COUNT(*) as count FROM family_members'),
        db.query<{ count: number }>('SELECT COUNT(*) as count FROM reminders'),
      ]);
      
      if (s.ok) counts.schemes = Number(s.rows[0]?.count || 0);
      if (p.ok) counts.profiles = Number(p.rows[0]?.count || 0);
      if (v.ok) counts.vault_items = Number(v.rows[0]?.count || 0);
      if (fg.ok) counts.family_groups = Number(fg.rows[0]?.count || 0);
      if (fm.ok) counts.family_members = Number(fm.rows[0]?.count || 0);
      if (r.ok) counts.reminders = Number(r.rows[0]?.count || 0);
      
      setCurrentDbCounts(counts);
    } catch (e) {
      console.error('Error fetching counts:', e);
    }

    const connected = await checkSupabaseConnection();
    setSupabaseConnected(connected);

    if (connected) {
      const tables = await checkSupabaseTablesExist();
      setTablesReady(tables.schemes && tables.profiles && tables.vault_items);
      setMigrationStatus({
        status: 'idle',
        message: tables.schemes ? 'Ready to migrate data' : 'Tables need to be created first',
        details: { tables, connected },
      });
    } else {
      setTablesReady(false);
      setMigrationStatus({
        status: 'error',
        message: 'Could not connect to Supabase. Create tables first.',
      });
    }
  }

  async function startMigration() {
    setMigrationStatus({ status: 'migrating', message: 'Starting migration...' });
    setMigrationResults({});

    const results: any = {};

    try {
      setMigrationStatus({ status: 'migrating', message: 'Migrating schemes...' });
      const schemesData = await db.query('SELECT * FROM schemes');
      if (schemesData.ok && schemesData.rows) {
        results.schemes = await migrateSchemes(schemesData.rows);
      }

      setMigrationStatus({ status: 'migrating', message: 'Migrating profiles...' });
      const profilesData = await db.query('SELECT * FROM profiles');
      if (profilesData.ok && profilesData.rows) {
        results.profiles = await migrateProfiles(profilesData.rows);
      }

      setMigrationStatus({ status: 'migrating', message: 'Migrating vault items...' });
      const vaultData = await db.query('SELECT * FROM vault_items');
      if (vaultData.ok && vaultData.rows) {
        results.vault_items = await migrateVaultItems(vaultData.rows);
      }

      setMigrationStatus({ status: 'migrating', message: 'Migrating family groups...' });
      const fgData = await db.query('SELECT * FROM family_groups');
      if (fgData.ok && fgData.rows) {
        results.family_groups = await migrateFamilyGroups(fgData.rows);
      }

      setMigrationStatus({ status: 'migrating', message: 'Migrating family members...' });
      const fmData = await db.query('SELECT * FROM family_members');
      if (fmData.ok && fmData.rows) {
        results.family_members = await migrateFamilyMembers(fmData.rows);
      }

      setMigrationStatus({ status: 'migrating', message: 'Migrating reminders...' });
      const remData = await db.query('SELECT * FROM reminders');
      if (remData.ok && remData.rows) {
        results.reminders = await migrateReminders(remData.rows);
      }

      setMigrationResults(results);
      
      const totalMigrated = Object.values(results).reduce((sum: number, r: any) => sum + (r.migrated || 0), 0);
      const totalFailed = Object.values(results).reduce((sum: number, r: any) => sum + (r.failed || 0), 0);
      
      setMigrationStatus({
        status: 'done',
        message: totalFailed === 0 
          ? `Successfully migrated ${totalMigrated} records!`
          : `Migrated ${totalMigrated} records, ${totalFailed} failed`,
        details: results,
      });
    } catch (e: any) {
      setMigrationStatus({ status: 'error', message: 'Migration failed: ' + e.message });
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-8 h-8 text-white" />
          <h1 className="text-2xl font-bold text-white">Database Migration</h1>
        </div>
        <p className="text-white/70">Transfer your data to Supabase</p>
      </div>

      <div className="px-6 py-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
            <h2 className="text-lg font-semibold text-[#1A1A2E]">Create Supabase Tables</h2>
          </div>
          <p className="text-gray-600 mb-4">
            First, create tables in your Supabase database.
          </p>
          <a
            href="/supabase_migration.sql"
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B3A6B] text-white rounded-xl font-medium hover:bg-[#2A4A8B] transition"
          >
            <ExternalLink className="w-4 h-4" />
            Download SQL File
          </a>
          <p className="text-sm text-gray-500 mt-2">
            Run in: <a href="https://supabase.com/dashboard/project/uvtedewjjkulnkthwcmk/sql" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase SQL Editor</a>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</div>
            <h2 className="text-lg font-semibold text-[#1A1A2E]">Verify Connection</h2>
          </div>
          
          <button
            onClick={checkStatus}
            disabled={migrationStatus.status === 'checking'}
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#1B3A6B] text-[#1B3A6B] rounded-xl font-medium hover:bg-[#1B3A6B]/5 transition disabled:opacity-50"
          >
            {migrationStatus.status === 'checking' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Check Status
          </button>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              {supabaseConnected ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
              <span>Supabase: {supabaseConnected ? 'Connected' : 'Not Connected'}</span>
            </div>
            <div className="flex items-center gap-2">
              {tablesReady ? <Check className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
              <span>Tables: {tablesReady ? 'Ready' : 'Need to be created'}</span>
            </div>
          </div>
        </div>

        {currentDbCounts && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">Your Data ({currentDbCounts.schemes} schemes, {currentDbCounts.profiles} profiles)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1B3A6B]">{currentDbCounts.schemes}</div>
                <div className="text-sm text-gray-600">Schemes</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1B3A6B]">{currentDbCounts.profiles}</div>
                <div className="text-sm text-gray-600">Profiles</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">Start Migration</h2>

          <button
            onClick={startMigration}
            disabled={!tablesReady || migrationStatus.status === 'migrating'}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {migrationStatus.status === 'migrating' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Migrating...</>
            ) : (
              <><ArrowRight className="w-5 h-5" /> Migrate to Supabase</>
            )}
          </button>

          {migrationStatus.message && (
            <div className={`mt-4 p-4 rounded-xl ${migrationStatus.status === 'done' ? 'bg-green-50 text-green-800' : migrationStatus.status === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
              <div className="flex items-center gap-2">
                {migrationStatus.status === 'done' && <Check className="w-5 h-5" />}
                {migrationStatus.status === 'error' && <X className="w-5 h-5" />}
                <span className="font-medium">{migrationStatus.message}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-[#1B3A6B] hover:underline">
            Back to App
          </Link>
        </div>
      </div>
    </div>
  );
}
