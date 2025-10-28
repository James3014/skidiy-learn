'use client';

import { useCurrentUser, useLogout } from '../../lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BottomNav from '../../components/BottomNav';
import { usePrivateLessonRecords } from '../../lib/hooks/use-lesson-records';

type StudentSummary = {
  mappingId: string;
  latestEvalDate: string;
  resortId: number;
  totalRatings: number;
  level?: string;
};

export default function StudentsPage() {
  const router = useRouter();
  const { isAuthenticated, role, accountId } = useCurrentUser();
  const logout = useLogout();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: records } = usePrivateLessonRecords();

  // Extract unique students from records
  const students: StudentSummary[] = [];
  const studentMap = new Map<string, StudentSummary>();

  records?.forEach((record) => {
    record.details.forEach((detail) => {
      const existing = studentMap.get(detail.studentMappingId);
      if (!existing || new Date(record.createdAt) > new Date(existing.latestEvalDate)) {
        studentMap.set(detail.studentMappingId, {
          mappingId: detail.studentMappingId,
          latestEvalDate: record.createdAt,
          resortId: detail.resortId,
          totalRatings: detail.coachRatings?.length || 0
        });
      }
    });
  });

  students.push(...studentMap.values());

  // Filter and sort students
  const filteredStudents = students
    .filter((student) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!student.mappingId.toLowerCase().includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.latestEvalDate).getTime() - new Date(a.latestEvalDate).getTime();
      } else {
        return a.mappingId.localeCompare(b.mappingId);
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
                學生管理
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 搜尋框 */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋學生姓名"
                className="w-full pl-10 pr-4 py-3 bg-zinc-100 dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <span className="material-symbols-outlined absolute left-3 top-3 text-zinc-400 dark:text-zinc-500">
                search
              </span>
            </div>

            {/* 程度篩選 */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-3 bg-zinc-100 dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="all">全部程度</option>
              <option value="beginner">初級班</option>
              <option value="intermediate">中級班</option>
              <option value="advanced">高級班</option>
            </select>

            {/* 排序 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="px-4 py-3 bg-zinc-100 dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="date">最近評量日期</option>
              <option value="name">按姓名排序</option>
            </select>
          </div>
        </div>

        {/* 學生列表 */}
        <div className="space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-zinc-400 dark:text-zinc-500">
                person_search
              </span>
              <h3 className="mt-4 text-lg font-bold text-zinc-700 dark:text-zinc-300">
                找不到學生資料
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                請嘗試調整搜尋條件
              </p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.mappingId}
                className="bg-white dark:bg-zinc-800/50 rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => {
                  // Open student rating history modal
                  // For now, just navigate to a placeholder
                  router.push(`/students/${student.mappingId}`);
                }}
              >
                <div className="flex items-center gap-4 justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar placeholder */}
                    <div className="flex items-center justify-center rounded-full bg-primary/20 text-primary shrink-0 size-16 overflow-hidden">
                      <span className="material-symbols-outlined text-4xl">person</span>
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <p className="text-zinc-900 dark:text-white text-base font-bold leading-normal">
                        {student.mappingId}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                          程度：初級班
                        </span>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm font-normal leading-normal">
                        最近評量：{new Date(student.latestEvalDate).toLocaleDateString('zh-TW', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
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
      </div>

      {/* 底部導航列 */}
      <BottomNav />
    </div>
  );
}
