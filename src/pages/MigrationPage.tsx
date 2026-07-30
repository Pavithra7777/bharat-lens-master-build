import { useState, useEffect } from 'react';
import { Link } from '../lib/Router';
import { Database, ArrowRight, Check, X, AlertCircle, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
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

interface MigrationStatus {
  status: 'idle' | 'checking' | 'migrating' | 'done' | 'error';
  message: string;
  details?: any;
}

export function MigrationPage() {
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [tablesReady, setTablesReady] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({ status: 'idle', message: '' });
  const [migrationResults, setMigrationResults] = useState<any>({});

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setMigrationStatus({ status: 'checking', message: 'Checking database status...' });

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
      setMigrationStatus({ status: 'migrating', message: 'Migration is a manual process. Please use the Supabase SQL Editor.' });
      setMigrationResults({});
      setMigrationStatus({
        status: 'done',
        message: 'Supabase is connected. Please run the SQL schema in your Supabase dashboard.',
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
            href="/supabase_schema.sql"
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

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">Supabase Status</h2>
          <p className="text-gray-600 mb-4">
            Your app is configured to use Supabase as the database. Once the schema is created in Supabase, all data will be stored there.
          </p>

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
