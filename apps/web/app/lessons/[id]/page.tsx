'use client';

import { useParams, useRouter } from 'next/navigation';
import { useLesson, useLessonSeats } from '../../../lib/hooks/use-lessons';
import { useLessonRecordsForLesson } from '../../../lib/hooks/use-lesson-records';
import { useCurrentUser, useLogout } from '../../../lib/hooks/use-auth';
import { useEffect, useState } from 'react';
import StudentRatingHistoryModal from '../../../components/StudentRatingHistoryModal';

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, role, accountId } = useCurrentUser();
  const logout = useLogout();
  const [mounted, setMounted] = useState(false);
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);

  const lessonId = params.id ? parseInt(params.id as string, 10) : 0;

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useLesson(lessonId);
  const { data: seats, isLoading: seatsLoading, error: seatsError } = useLessonSeats(lessonId, true);
  const { data: lessonRecords } = useLessonRecordsForLesson(lessonId);

  // 建立一個 mappingId 到評分狀態的映射
  const getRatingStatusForSeat = (mappingId: string | null) => {
    if (!mappingId || !lessonRecords) return null;

    // 找到該學員的教學記錄詳情
    for (const record of lessonRecords) {
      const detail = record.details.find(d => d.studentMappingId === mappingId);
      if (detail) {
        return {
          hasRecord: true,
          hasRatings: detail.coachRatings && detail.coachRatings.length > 0,
          ratingsCount: detail.coachRatings?.length || 0,
          recordId: record.id,
          detailId: detail.id
        };
      }
    }
    return null;
  };

  if (!mounted || !isAuthenticated) {
    return null;
  }

  const isLoading = lessonLoading || seatsLoading;
  const error = lessonError || seatsError;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* 頂部導航欄 */}
      <nav className="bg-background-light dark:bg-background-dark shadow-sm dark:shadow-md dark:shadow-black/20 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
              >
                <span className="material-symbols-outlined text-xl mr-1">arrow_back</span>
                返回
              </button>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                課程詳情
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 載入狀態 */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">載入課程資料中...</p>
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
              {(error as any)?.response?.data?.message || '無法載入課程資料'}
            </p>
          </div>
        )}

        {/* 課程資料 */}
        {lesson && (
          <div className="space-y-6">
            {/* 課程基本資訊卡片 */}
            <div className="bg-white dark:bg-zinc-800/50 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                    課程 #{lesson.id}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center">
                      <svg
                        className="mr-2 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {lesson.lessonDate && new Date(lesson.lessonDate).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      雪場 {lesson.resortId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-background-light dark:bg-background-dark rounded-lg p-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">總席位數</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{seats?.length || 0}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">已認領席位</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {seats?.filter((s) => s.status === 'claimed').length || 0}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">待處理席位</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                    {seats?.filter((s) => s.status === 'pending').length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* 席位列表 */}
            <div className="bg-white dark:bg-zinc-800/50 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">席位管理</h3>
              </div>

              {seats && seats.length > 0 ? (
                <div className="space-y-3">
                  {seats.map((seat) => {
                    const ratingStatus = getRatingStatusForSeat(seat.claimedMappingId);

                    return (
                    <div
                      key={seat.id}
                      className={`border rounded-lg p-4 transition ${
                        seat.status === 'claimed'
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 hover:bg-background-light dark:bg-background-dark'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2 flex-wrap">
                            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                              席位 #{seat.seatNumber}
                            </span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                seat.status === 'claimed'
                                  ? 'bg-green-100 text-green-800'
                                  : seat.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {seat.status === 'claimed'
                                ? '已認領'
                                : seat.status === 'pending'
                                ? '待處理'
                                : seat.status}
                            </span>
                            {ratingStatus?.hasRecord && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                📝 已建立記錄
                              </span>
                            )}
                            {ratingStatus?.hasRatings && seat.claimedMappingId && (
                              <button
                                onClick={() => setSelectedMappingId(seat.claimedMappingId)}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition cursor-pointer"
                                title="點擊查看歷史評分"
                              >
                                ⭐ 已評分 ({ratingStatus.ratingsCount})
                              </button>
                            )}
                          </div>

                          {seat.claimedAt && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                              認領時間：
                              {new Date(seat.claimedAt).toLocaleString('zh-TW', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}

                          {seat.selfEval && (
                            <div className="mt-3 bg-white dark:bg-zinc-800/50 border border-blue-100 rounded-lg p-3">
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                學生自評
                              </p>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">自評等級：</span>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < seat.selfEval!.selfRating
                                          ? 'text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                  <span className="ml-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {seat.selfEval.selfRating}/5
                                  </span>
                                </div>
                              </div>
                              {seat.selfEval.selfComment && (
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">
                                  {seat.selfEval.selfComment}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {seat.status === 'claimed' && seat.claimedMappingId && (
                          <button
                            onClick={() => {
                              router.push(
                                `/lessons/${lessonId}/records/new?seatId=${seat.id}&mappingId=${seat.claimedMappingId}`
                              );
                            }}
                            className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                          >
                            建立教學記錄
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">
                    尚無席位資料
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    此課程目前沒有任何席位
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 學員評分歷史模態視窗 */}
      {selectedMappingId && (
        <StudentRatingHistoryModal
          mappingId={selectedMappingId}
          onClose={() => setSelectedMappingId(null)}
        />
      )}
    </div>
  );
}
