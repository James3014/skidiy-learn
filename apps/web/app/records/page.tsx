'use client';

import { useCurrentUser, useLogout } from '../../lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BottomNav from '../../components/BottomNav';
import { usePrivateLessonRecords } from '../../lib/hooks/use-lesson-records';

export default function RecordsPage() {
  const router = useRouter();
  const { isAuthenticated, role, accountId } = useCurrentUser();
  const logout = useLogout();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resortFilter, setResortFilter] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: records, isLoading, error } = usePrivateLessonRecords();

  // Filter records
  const filteredRecords = records?.filter((record) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = record.id.toLowerCase().includes(query);
      const matchesLesson = record.lessonId.toString().includes(query);
      if (!matchesId && !matchesLesson) return false;
    }

    if (resortFilter !== 'all') {
      if (record.details[0]?.resortId !== parseInt(resortFilter)) return false;
    }

    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!mounted || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      {/* 頂部導航欄 */}
      <nav className="bg-background-light dark:bg-background-dark sticky top-0 z-10 shadow-sm dark:shadow-md dark:shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                教學紀錄
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {role === 'instructor' ? '教練' : role} | {accountId}
              </span>
              <button
                onClick={logout}
                className="flex items-center justify-center rounded-lg h-10 w-10 bg-transparent text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <span className="material-symbols-outlined text-2xl">account_circle</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* 搜尋和篩選 */}
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 搜尋框 */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋學生姓名..."
                className="w-full pl-10 pr-4 py-3 bg-zinc-100 dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <span className="material-symbols-outlined absolute left-3 top-3 text-zinc-400 dark:text-zinc-500">
                search
              </span>
            </div>

            {/* 雪場篩選 */}
            <select
              value={resortFilter}
              onChange={(e) => setResortFilter(e.target.value)}
              className="px-4 py-3 bg-secondary text-zinc-900 dark:text-white rounded-full focus:ring-2 focus:ring-secondary focus:border-transparent outline-none font-medium"
            >
              <option value="all">全部雪場</option>
              <option value="1">雪場 1</option>
              <option value="2">雪場 2</option>
              <option value="3">雪場 3</option>
            </select>
          </div>
        </div>

        {/* 載入狀態 */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">載入教學紀錄中...</p>
            </div>
          </div>
        )}

        {/* 錯誤狀態 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
              載入失敗
            </h3>
            <p className="text-red-600 dark:text-red-300">
              {(error as any)?.response?.data?.message || '無法載入教學紀錄'}
            </p>
          </div>
        )}

        {/* 紀錄列表 */}
        {records && (
          <div className="space-y-3">
            {filteredRecords && filteredRecords.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-zinc-400 dark:text-zinc-500">
                  search_off
                </span>
                <h3 className="mt-4 text-lg font-bold text-zinc-700 dark:text-zinc-300">
                  找不到教學紀錄
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  試試看調整篩選條件，或新增一筆新的教學紀錄吧！
                </p>
              </div>
            ) : (
              filteredRecords?.map((record) => (
                <div
                  key={record.id}
                  className="bg-white dark:bg-zinc-800/50 rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/lessons/${record.lessonId}`)}
                >
                  <div className="flex items-center gap-4 justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0 size-12">
                        <span className="material-symbols-outlined text-3xl">calendar_today</span>
                      </div>
                      <div className="flex flex-col justify-center flex-1">
                        <p className="text-zinc-900 dark:text-white text-base font-bold leading-normal">
                          {new Date(record.createdAt).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-normal leading-normal line-clamp-2">
                          {record.details[0] && `雪場 ${record.details[0].resortId}`} -
                          課程 #{record.lessonId} -
                          {record.details.length} 位學生
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="material-symbols-outlined text-secondary text-xl">
                        arrow_forward_ios
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 底部導航列 */}
      <BottomNav />
    </div>
  );
}
