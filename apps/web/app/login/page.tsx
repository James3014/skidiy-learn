'use client';

import { useState } from 'react';
import { useLogin } from '../../lib/hooks/use-auth';

export default function LoginPage() {
  const [accountId, setAccountId] = useState('');
  const login = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim()) return;

    login.mutate({ accountId });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="bg-white dark:bg-zinc-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/40 border border-zinc-200 dark:border-zinc-700 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            DIY Ski 教學評量系統
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">教練登入</p>
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
              className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="請輸入帳號 ID"
              disabled={login.isPending}
            />
          </div>

          {login.isError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                登入失敗：{(login.error as any)?.response?.data?.message || '請檢查帳號 ID'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={login.isPending || !accountId.trim()}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-zinc-400 dark:disabled:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {login.isPending ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                登入中...
              </span>
            ) : (
              '登入'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>開發環境：使用測試帳號 ID 登入</p>
          <p className="mt-1">例如：instructor-1</p>
        </div>
      </div>
    </div>
  );
}
