'use client';

import { useLessons } from '../../lib/hooks/use-lessons';
import { useCurrentUser, useLogout } from '../../lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BottomNav from '../../components/BottomNav';

export default function LessonsPage() {
  const router = useRouter();
  const { isAuthenticated, role, accountId } = useCurrentUser();
  const logout = useLogout();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'resort'>('date');

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: lessons, isLoading, error } = useLessons({
    role: role === 'instructor' ? 'coach' : undefined
  });

  // Filter and sort lessons
  const filteredLessons = lessons?.filter((lesson) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = lesson.id.toString().includes(query);
      const matchesResort = lesson.resortId.toString().includes(query);
      if (!matchesId && !matchesResort) return false;
    }

    // Date filter
    if (dateFilter !== 'all' && lesson.lessonDate) {
      const lessonDate = new Date(lesson.lessonDate);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (dateFilter) {
        case 'today':
          const lessonDay = new Date(
            lessonDate.getFullYear(),
            lessonDate.getMonth(),
            lessonDate.getDate()
          );
          if (lessonDay.getTime() !== today.getTime()) return false;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (lessonDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          if (lessonDate < monthAgo) return false;
          break;
      }
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.lessonDate || 0).getTime() - new Date(a.lessonDate || 0).getTime();
    } else {
      return a.resortId - b.resortId;
    }
  });

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
                教練儀表板
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
        <h2 className="text-zinc-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3">
          今日課程
        </h2>

        {/* 篩選和搜尋控制列 */}
        {lessons && lessons.length > 0 && (
          <div className="bg-white dark:bg-zinc-800/50 rounded-xl shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 搜尋框 */}
              <div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋課程編號或雪場..."
                    className="w-full pl-10 pr-4 py-3 bg-zinc-100 dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-3 text-zinc-400 dark:text-zinc-500">
                    search
                  </span>
                </div>
              </div>

              {/* 日期篩選 */}
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="all">全部日期</option>
                  <option value="today">今天</option>
                  <option value="week">最近 7 天</option>
                  <option value="month">最近 30 天</option>
                </select>
              </div>

              {/* 排序 */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="date">按日期排序（新到舊）</option>
                  <option value="resort">按雪場排序</option>
                </select>
              </div>
            </div>

            {/* 結果統計 */}
            {(searchQuery || dateFilter !== 'all') && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  找到 <span className="font-semibold text-primary">{filteredLessons?.length || 0}</span> 個課程
                  {searchQuery && (
                    <span className="ml-2">
                      搜尋：「{searchQuery}」
                    </span>
                  )}
                  {dateFilter !== 'all' && (
                    <span className="ml-2">
                      範圍：{dateFilter === 'today' ? '今天' : dateFilter === 'week' ? '最近 7 天' : '最近 30 天'}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setDateFilter('all');
                    }}
                    className="ml-4 text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    清除篩選
                  </button>
                </p>
              </div>
            )}
          </div>
        )}

        {/* 載入狀態 */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">載入課程中...</p>
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
              {(error as any)?.response?.data?.message || '無法載入課程列表'}
            </p>
          </div>
        )}

        {/* 課程列表 */}
        {lessons && (
          <div className="space-y-3">
            {filteredLessons && filteredLessons.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-zinc-400 dark:text-zinc-500">
                  beach_access
                </span>
                <h3 className="mt-4 text-lg font-bold text-zinc-700 dark:text-zinc-300">
                  {searchQuery || dateFilter !== 'all' ? '找不到符合條件的課程' : '今日無課程安排'}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {searchQuery || dateFilter !== 'all'
                    ? '請嘗試調整搜尋條件或篩選設定'
                    : '好好休息吧！'}
                </p>
              </div>
            ) : (
              filteredLessons?.map((lesson) => {
                const hasPendingSeats = lesson.seats?.some((s: any) => s.status === 'pending' || s.status === 'claimed');
                return (
                  <div
                    key={lesson.id}
                    className="bg-white dark:bg-zinc-800/50 rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                    onClick={() => router.push(`/lessons/${lesson.id}`)}
                  >
                    <div className="flex items-center gap-4 justify-between min-h-[72px]">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center rounded-lg bg-secondary/20 text-secondary shrink-0 size-12">
                          <span className="material-symbols-outlined text-3xl">snowboarding</span>
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-zinc-900 dark:text-white text-base font-bold leading-normal">
                              {lesson.lessonDate && new Date(lesson.lessonDate).toLocaleDateString('zh-TW', {
                                month: '2-digit',
                                day: '2-digit'
                              })} - 課程 #{lesson.id}
                            </p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                              雪場 {lesson.resortId}
                            </span>
                          </div>
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-normal leading-normal line-clamp-1">
                            {lesson.seats && (
                              <>
                                席位：{lesson.seats.length} |
                                已認領：{lesson.seats.filter((s: any) => s.status === 'claimed').length} |
                                待處理：{lesson.seats.filter((s: any) => s.status === 'pending').length}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {hasPendingSeats && (
                          <span className="text-secondary text-sm font-medium">待評量</span>
                        )}
                        <span className="material-symbols-outlined text-secondary text-xl">
                          arrow_forward_ios
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 底部導航列 */}
      <BottomNav />
    </div>
  );
}
