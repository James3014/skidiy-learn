'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getApiBaseUrl } from '../../lib/utils/env';

const API_URL = getApiBaseUrl();

export default function LoginTestPage() {
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/api/v1/auth/login`, { accountId });

      const { accessToken, role } = response.data;

      // 儲存到 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('userRole', role);
        localStorage.setItem('accountId', accountId);
      }

      // 導向課程頁面
      router.push('/lessons');
    } catch (err: any) {
      setError(err.response?.data?.message || '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="bg-white dark:bg-zinc-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/40 border border-zinc-200 dark:border-zinc-700 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            DIY Ski 教學評量系統
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">教練登入（測試版）</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="accountId"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              帳號 ID
            </label>
            <input
              type="text"
              id="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
              placeholder="請輸入帳號 ID"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !accountId.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>測試帳號：demo-instructor-1</p>
        </div>
      </div>
    </div>
  );
}
