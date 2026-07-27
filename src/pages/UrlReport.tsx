import { useEffect, useState } from 'react';
import db from '../lib/db';

interface Scheme {
  id: string;
  title: string;
  apply_url: string;
  official_url: string;
}

interface UrlStatus {
  url: string;
  status: 'pending' | 'checking' | 'ok' | 'error' | 'unknown';
}

export default function UrlReport() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [urlStatuses, setUrlStatuses] = useState<Record<string, UrlStatus>>({});
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testIndex, setTestIndex] = useState(0);

  useEffect(() => {
    loadSchemes();
  }, []);

  async function loadSchemes() {
    const data = await db.getSchemes();
    setSchemes(data);
    const statuses: Record<string, UrlStatus> = {};
    data.forEach(s => {
      if (s.apply_url) statuses[s.apply_url] = { url: s.apply_url, status: 'pending' };
      if (s.official_url) statuses[s.official_url] = { url: s.official_url, status: 'pending' };
    });
    setUrlStatuses(statuses);
    setLoading(false);
  }

  async function runAllTests() {
    setTesting(true);
    const uniqueUrls = [...new Set(schemes.flatMap(s => [s.apply_url, s.official_url].filter(Boolean)))];

    for (let i = 0; i < uniqueUrls.length; i++) {
      setTestIndex(i);
      const url = uniqueUrls[i];
      setUrlStatuses(prev => ({ ...prev, [url]: { url, status: 'checking' } }));

      await new Promise<void>((resolve) => {
        const img = document.createElement('img');
        img.onload = () => { setUrlStatuses(prev => ({ ...prev, [url]: { url, status: 'ok' } })); resolve(); };
        img.onerror = () => { setUrlStatuses(prev => ({ ...prev, [url]: { url, status: 'error' } })); resolve(); };
        img.src = url;
        setTimeout(resolve, 5000);
      });
    }
    setTesting(false);
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'ok': return <span className="text-green-500">✅</span>;
      case 'error': return <span className="text-red-500">❌</span>;
      case 'checking': return <span className="text-yellow-500">⏳</span>;
      default: return <span className="text-gray-400">❓</span>;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Loading schemes...</p>
      </div>
    );
  }

  const totalUrls = schemes.flatMap(s => [s.apply_url, s.official_url].filter(Boolean)).length;
  const testedUrls = Object.values(urlStatuses).filter(s => s.status !== 'pending').length;
  const errorUrls = Object.values(urlStatuses).filter(s => s.status === 'error').length;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">🔗 URL Accessibility Report</h1>
        <p className="text-white/70 mt-1">{schemes.length} schemes ({totalUrls} URLs)</p>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-[#1B3A6B]">{schemes.length}</div>
            <div className="text-sm text-gray-500">Total Schemes</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-red-500">{errorUrls}</div>
            <div className="text-sm text-gray-500">Broken URLs</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-500">{totalUrls - testedUrls}</div>
            <div className="text-sm text-gray-500">Untested</div>
          </div>
        </div>

        <button
          onClick={runAllTests}
          disabled={testing}
          className="w-full py-4 bg-[#1B3A6B] text-white rounded-xl font-medium mb-6 disabled:opacity-50"
        >
          {testing ? `Testing ${testIndex + 1}/${totalUrls}...` : '🧪 Run URL Tests'}
        </button>

        <div className="space-y-3">
          {schemes.map((scheme, idx) => {
            const applyStatus = urlStatuses[scheme.apply_url]?.status || 'pending';
            const officialStatus = urlStatuses[scheme.official_url]?.status || 'pending';

            return (
              <div key={scheme.id} className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-medium text-[#1A1A2E] mb-2">{idx + 1}. {scheme.title}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(applyStatus)}
                    <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                      {scheme.apply_url}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(officialStatus)}
                    <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                      {scheme.official_url}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
