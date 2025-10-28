'use client';

import { useLatestRatings } from '../lib/hooks/use-lesson-records';
import type { CoachRating } from '../lib/api/client';

type StudentRatingHistoryModalProps = {
  mappingId: string;
  onClose: () => void;
};

const PROFICIENCY_LABELS = {
  knew: '認識 ⭐',
  familiar: '熟悉 ⭐⭐',
  excellent: '優秀 ⭐⭐⭐'
} as const;

export default function StudentRatingHistoryModal({
  mappingId,
  onClose
}: StudentRatingHistoryModalProps) {
  const { data: latestRatings, isLoading } = useLatestRatings(mappingId);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">學員歷史評分記錄</h2>
            <p className="text-sm text-blue-100 mt-1">學員 ID: {mappingId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">載入歷史記錄中...</p>
              </div>
            </div>
          )}

          {!isLoading && latestRatings && latestRatings.length > 0 && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">總評分項目</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {latestRatings.length}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">認識等級</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {latestRatings.filter((r) => r.proficiencyBand === 'knew').length}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">熟悉+優秀</p>
                  <p className="text-2xl font-bold text-green-700">
                    {
                      latestRatings.filter(
                        (r) =>
                          r.proficiencyBand === 'familiar' ||
                          r.proficiencyBand === 'excellent'
                      ).length
                    }
                  </p>
                </div>
              </div>

              {/* Ratings List */}
              <div className="space-y-3">
                {latestRatings.map((rating) => (
                  <div
                    key={rating.abilityId}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {rating.abilityName}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              rating.proficiencyBand === 'excellent'
                                ? 'bg-green-100 text-green-800'
                                : rating.proficiencyBand === 'familiar'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {PROFICIENCY_LABELS[rating.proficiencyBand]}
                          </span>
                          <span className="text-xs text-gray-500">
                            評分於{' '}
                            {new Date(rating.ratedAt).toLocaleDateString('zh-TW', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {rating.comment && (
                      <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                        <span className="font-medium">評論：</span>
                        {rating.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && (!latestRatings || latestRatings.length === 0) && (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                尚無歷史評分記錄
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                這位學員還沒有任何評分記錄
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
