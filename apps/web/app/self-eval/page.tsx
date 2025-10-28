'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { getApiBaseUrl } from '../../lib/utils/env';

const API_URL = getApiBaseUrl();

type SelfEvaluation = {
  selfRating: number;
  selfComment: string;
};

export default function SelfEvaluationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">載入中...</div>}>
      <SelfEvaluationContent />
    </Suspense>
  );
}

function SelfEvaluationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mappingId = searchParams.get('mappingId');
  const lessonId = searchParams.get('lessonId');

  const [rating, setRating] = useState<number>(3);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingEval, setExistingEval] = useState<SelfEvaluation | null>(null);

  useEffect(() => {
    if (!mappingId || !lessonId) {
      setError('缺少必要參數');
      return;
    }

    // Load existing self-evaluation if exists
    const loadExisting = async () => {
      try {
        // Fetch lesson seats with self-eval data
        const response = await axios.get(`${API_URL}/api/api/v1/lessons/${lessonId}/seats`, {
          params: { include: 'self_eval' }
        });

        const seats = response.data;
        const mySeat = seats.find((s: any) => s.claimedMappingId === mappingId);

        if (mySeat?.selfEval) {
          setExistingEval(mySeat.selfEval);
          setRating(mySeat.selfEval.selfRating);
          setComment(mySeat.selfEval.selfComment || '');
        }
      } catch (err) {
        console.error('Failed to load existing evaluation:', err);
      }
    };

    loadExisting();
  }, [mappingId, lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mappingId || !lessonId) {
      setError('缺少必要參數');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Submit self-evaluation
      await axios.post(
        `${API_URL}/api/api/v1/students/${mappingId}/lessons/${lessonId}/self-eval`,
        {
          selfRating: rating,
          selfComment: comment || null
        }
      );

      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || '提交失敗');
    } finally {
      setLoading(false);
    }
  };

  if (!mappingId || !lessonId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">缺少必要參數</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <nav className="bg-white dark:bg-zinc-800 shadow-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
            >
              <svg
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回
            </button>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              課前自我評估
            </h1>
            <div className="w-16" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success ? (
          <div className="bg-white dark:bg-zinc-800/50 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <svg
              className="mx-auto h-16 w-16 text-green-600 dark:text-green-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              提交成功！
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              您的自我評估已儲存，正在返回...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                關於課前自評
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                課前自評可以幫助教練更了解您目前的程度，以便提供更適合的教學內容。
                {existingEval && '您之前已填寫過自評，可以更新您的評估。'}
              </p>
            </div>

            {/* Lesson Info */}
            <div className="bg-white dark:bg-zinc-800/50 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                課程資訊
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">課程 ID：</span>
                  <span className="font-medium text-zinc-900 dark:text-white">#{lessonId}</span>
                </div>
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">學生 ID：</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{mappingId}</span>
                </div>
              </div>
            </div>

            {/* Rating Section */}
            <div className="bg-white dark:bg-zinc-800/50 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                自我評分（1-5分）
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                請根據您目前的滑雪能力進行評分：
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">1 分 - 完全沒經驗</span>
                  <span className="text-zinc-600 dark:text-zinc-400">5 分 - 非常熟練</span>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`w-16 h-16 rounded-full font-bold text-xl transition-all ${
                      rating === value
                        ? 'bg-blue-600 text-white shadow-lg scale-110'
                        : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>

              {/* Rating Description */}
              <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-700/30 rounded-lg">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {rating === 1 && '完全沒有滑雪經驗，第一次接觸'}
                  {rating === 2 && '有少量經驗，但還不太熟悉'}
                  {rating === 3 && '有一定經驗，能夠基本滑行'}
                  {rating === 4 && '相當熟練，能夠應對大部分雪道'}
                  {rating === 5 && '非常熟練，可以處理各種複雜情況'}
                </p>
              </div>
            </div>

            {/* Comment Section */}
            <div className="bg-white dark:bg-zinc-800/50 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                補充說明（選填）
              </h2>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition resize-none"
                rows={5}
                placeholder="例如：我之前學過幾次，但對於轉彎還不太熟悉..."
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium py-3 px-4 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? '提交中...' : existingEval ? '更新自評' : '提交自評'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
