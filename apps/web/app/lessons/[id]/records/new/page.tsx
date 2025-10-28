'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useLesson } from '../../../../../lib/hooks/use-lessons';
import {
  useAnalysisGroups,
  usePracticeSkills,
  useCreateLessonRecord,
  useAbilities,
  useLatestRatings,
  useCreateCoachRatings
} from '../../../../../lib/hooks/use-lesson-records';
import { useCurrentUser, useLogout } from '../../../../../lib/hooks/use-auth';
import type { CoachRatingRequest } from '../../../../../lib/api/client';

type AnalysisSelection = {
  analysisGroupId?: number;
  analysisItemId?: number;
  customAnalysis?: string;
};

type PracticeSelection = {
  skillId?: number;
  drillId?: number;
  customDrill?: string;
  practiceNotes?: string;
};

type RatingState = {
  [abilityId: number]: {
    rating: number;
    proficiencyBand: 'knew' | 'familiar' | 'excellent';
    comment: string;
  };
};

const PROFICIENCY_LABELS = {
  knew: '認識 ⭐',
  familiar: '熟悉 ⭐⭐',
  excellent: '優秀 ⭐⭐⭐'
} as const;

export default function NewLessonRecordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">載入課程中...</div>}>
      <NewLessonRecordContent />
    </Suspense>
  );
}

function NewLessonRecordContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, role, accountId } = useCurrentUser();
  const logout = useLogout();
  const [mounted, setMounted] = useState(false);

  const lessonId = params.id ? parseInt(params.id as string, 10) : 0;
  const seatId = searchParams.get('seatId');
  const mappingId = searchParams.get('mappingId');

  const [summary, setSummary] = useState('');
  const [analyses, setAnalyses] = useState<AnalysisSelection[]>([]);
  const [practices, setPractices] = useState<PracticeSelection[]>([]);
  const [ratings, setRatings] = useState<RatingState>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [quickRatingMode, setQuickRatingMode] = useState<'knew' | 'familiar' | 'excellent' | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
    if (!seatId || !mappingId) {
      router.back();
    }
  }, [isAuthenticated, seatId, mappingId, router]);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!mappingId || !lessonId) return;

    const draftKey = `lesson-record-draft-${lessonId}-${mappingId}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setSummary(draft.summary || '');
        setAnalyses(draft.analyses || []);
        setPractices(draft.practices || []);
        setRatings(draft.ratings || {});
        setDraftLoaded(true);
        setLastSaved(draft.savedAt);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [lessonId, mappingId]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!mappingId || !lessonId || !mounted) return;

    const draftKey = `lesson-record-draft-${lessonId}-${mappingId}`;
    const draft = {
      summary,
      analyses,
      practices,
      ratings,
      savedAt: new Date().toISOString()
    };

    const timeoutId = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(draft));
      setLastSaved(draft.savedAt);
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
  }, [summary, analyses, practices, ratings, lessonId, mappingId, mounted]);

  const { data: lesson, isLoading: lessonLoading } = useLesson(lessonId);
  const { data: analysisGroups, isLoading: analysisLoading } = useAnalysisGroups();
  const { data: practiceSkills, isLoading: practiceLoading } = usePracticeSkills();
  const { data: abilities, isLoading: abilitiesLoading } = useAbilities();
  const { data: latestRatings } = useLatestRatings(mappingId || '');
  const createRecord = useCreateLessonRecord();
  const createRatings = useCreateCoachRatings();

  // Group abilities by category
  const categories = abilities
    ? Array.from(new Set(abilities.map((a) => a.category)))
    : [];

  // Filter and sort abilities
  const filteredAbilities = abilities
    ?.filter((a) => !selectedCategory || a.category === selectedCategory)
    .sort((a, b) => {
      // Sort by skillLevel first, then by sequenceInLevel
      if (a.skillLevel !== b.skillLevel) {
        return a.skillLevel - b.skillLevel;
      }
      return a.sequenceInLevel - b.sequenceInLevel;
    });

  const handleAddAnalysis = () => {
    setAnalyses([...analyses, {}]);
  };

  const handleRemoveAnalysis = (index: number) => {
    setAnalyses(analyses.filter((_, i) => i !== index));
  };

  const handleAnalysisChange = (index: number, field: keyof AnalysisSelection, value: any) => {
    const newAnalyses = [...analyses];
    newAnalyses[index] = { ...newAnalyses[index], [field]: value };
    setAnalyses(newAnalyses);
  };

  const handleAddPractice = () => {
    setPractices([...practices, {}]);
  };

  const handleRemovePractice = (index: number) => {
    setPractices(practices.filter((_, i) => i !== index));
  };

  const handlePracticeChange = (index: number, field: keyof PracticeSelection, value: any) => {
    const newPractices = [...practices];
    newPractices[index] = { ...newPractices[index], [field]: value };
    setPractices(newPractices);
  };

  const handleRatingChange = (
    abilityId: number,
    rating: number,
    proficiencyBand: 'knew' | 'familiar' | 'excellent'
  ) => {
    setRatings({
      ...ratings,
      [abilityId]: {
        rating,
        proficiencyBand,
        comment: ratings[abilityId]?.comment || ''
      }
    });
  };

  const handleCommentChange = (abilityId: number, comment: string) => {
    if (ratings[abilityId]) {
      setRatings({
        ...ratings,
        [abilityId]: {
          ...ratings[abilityId],
          comment
        }
      });
    }
  };

  const handleQuickRateCategory = (proficiencyBand: 'knew' | 'familiar' | 'excellent') => {
    if (!filteredAbilities) return;

    const newRatings = { ...ratings };
    const bandToRating = { knew: 1, familiar: 2, excellent: 3 };

    filteredAbilities.forEach((ability) => {
      newRatings[ability.id] = {
        rating: bandToRating[proficiencyBand],
        proficiencyBand,
        comment: newRatings[ability.id]?.comment || ''
      };
    });

    setRatings(newRatings);
    setQuickRatingMode(null);
  };

  const handleClearCategoryRatings = () => {
    if (!filteredAbilities) return;

    const newRatings = { ...ratings };
    filteredAbilities.forEach((ability) => {
      delete newRatings[ability.id];
    });

    setRatings(newRatings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mappingId) return;

    try {
      // Step 1: Create lesson record
      const response = await createRecord.mutateAsync({
        lessonId,
        summary,
        details: [
          {
            studentMappingId: mappingId,
            analyses: analyses.filter(a => a.analysisItemId || a.customAnalysis),
            practices: practices.filter(p => p.drillId || p.customDrill)
          }
        ]
      });

      const detailId = response.details[0]?.id;

      // Step 2: Create ratings if any were provided
      if (detailId && Object.keys(ratings).length > 0) {
        const ratingRequests: CoachRatingRequest[] = Object.entries(ratings).map(
          ([abilityId, data]) => ({
            lessonRecordDetailId: detailId,
            abilityId: parseInt(abilityId),
            rating: data.rating,
            proficiencyBand: data.proficiencyBand,
            comment: data.comment || undefined
          })
        );

        await createRatings.mutateAsync({ ratings: ratingRequests });
      }

      // Clear draft from localStorage
      const draftKey = `lesson-record-draft-${lessonId}-${mappingId}`;
      localStorage.removeItem(draftKey);

      // Show success message
      setShowSuccess(true);

      // Navigate back to lesson detail after a short delay
      setTimeout(() => {
        router.push(`/lessons/${lessonId}`);
      }, 1500);
    } catch (error) {
      console.error('Failed to create lesson record:', error);
    }
  };

  if (!mounted || !isAuthenticated || !seatId || !mappingId) {
    return null;
  }

  const isLoading = lessonLoading || analysisLoading || practiceLoading || abilitiesLoading;

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
                建立教學記錄與評分
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">載入資料中...</p>
            </div>
          </div>
        )}

        {!isLoading && lesson && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 草稿狀態指示器 */}
            {draftLoaded && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-yellow-400 dark:text-yellow-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <span className="font-medium">已載入先前的草稿</span>
                    {lastSaved && (
                      <span className="ml-2">
                        (儲存於 {new Date(lastSaved).toLocaleTimeString('zh-TW')})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* 自動保存指示 */}
            {lastSaved && !draftLoaded && (
              <div className="text-right">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  💾 自動儲存於 {new Date(lastSaved).toLocaleTimeString('zh-TW')}
                </span>
              </div>
            )}

            {/* 課程資訊 */}
            <div className="bg-white dark:bg-zinc-800/50 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">課程資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">課程編號：</span>
                  <span className="font-medium text-zinc-900 dark:text-white">#{lesson.id}</span>
                </div>
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">雪場：</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{lesson.resortId}</span>
                </div>
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">日期：</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {lesson.lessonDate && new Date(lesson.lessonDate).toLocaleDateString('zh-TW')}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">學生 ID：</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{mappingId}</span>
                </div>
              </div>
            </div>

            {/* 教學總結 */}
            <div className="bg-white dark:bg-zinc-800/50 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">教學總結</h2>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                rows={4}
                placeholder="請輸入本次教學的整體總結..."
              />
            </div>

            {/* 分析項目 */}
            <div className="bg-white dark:bg-zinc-800/50 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">分析項目</h2>
                <button
                  type="button"
                  onClick={handleAddAnalysis}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition"
                >
                  + 新增分析
                </button>
              </div>

              {analyses.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center py-8">
                  尚未新增分析項目,點擊上方按鈕新增
                </p>
              ) : (
                <div className="space-y-4">
                  {analyses.map((analysis, index) => (
                    <div key={index} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-800/30">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          分析 #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAnalysis(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                        >
                          移除
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            分析群組
                          </label>
                          <select
                            value={analysis.analysisGroupId || ''}
                            onChange={(e) => {
                              const groupId = e.target.value ? parseInt(e.target.value) : undefined;
                              handleAnalysisChange(index, 'analysisGroupId', groupId);
                              handleAnalysisChange(index, 'analysisItemId', undefined);
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          >
                            <option value="">選擇群組</option>
                            {analysisGroups?.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {analysis.analysisGroupId && (
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                              分析項目
                            </label>
                            <select
                              value={analysis.analysisItemId || ''}
                              onChange={(e) =>
                                handleAnalysisChange(
                                  index,
                                  'analysisItemId',
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            >
                              <option value="">選擇項目</option>
                              {analysisGroups
                                ?.find((g) => g.id === analysis.analysisGroupId)
                                ?.items.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            自訂分析（選填）
                          </label>
                          <input
                            type="text"
                            value={analysis.customAnalysis || ''}
                            onChange={(e) =>
                              handleAnalysisChange(index, 'customAnalysis', e.target.value)
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="輸入自訂分析內容"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 練習設計 */}
            <div className="bg-white dark:bg-zinc-800/50 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">練習設計</h2>
                <button
                  type="button"
                  onClick={handleAddPractice}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition"
                >
                  + 新增練習
                </button>
              </div>

              {practices.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center py-8">
                  尚未新增練習項目，點擊上方按鈕新增
                </p>
              ) : (
                <div className="space-y-4">
                  {practices.map((practice, index) => (
                    <div key={index} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-800/30">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          練習 #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePractice(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                        >
                          移除
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            技能分類
                          </label>
                          <select
                            value={practice.skillId || ''}
                            onChange={(e) => {
                              const skillId = e.target.value ? parseInt(e.target.value) : undefined;
                              handlePracticeChange(index, 'skillId', skillId);
                              handlePracticeChange(index, 'drillId', undefined);
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          >
                            <option value="">選擇技能</option>
                            {practiceSkills?.map((skill) => (
                              <option key={skill.id} value={skill.id}>
                                {skill.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {practice.skillId && (
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                              練習項目
                            </label>
                            <select
                              value={practice.drillId || ''}
                              onChange={(e) =>
                                handlePracticeChange(
                                  index,
                                  'drillId',
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            >
                              <option value="">選擇項目</option>
                              {practiceSkills
                                ?.find((s) => s.id === practice.skillId)
                                ?.drills.map((drill) => (
                                  <option key={drill.id} value={drill.id}>
                                    {drill.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            自訂練習（選填）
                          </label>
                          <input
                            type="text"
                            value={practice.customDrill || ''}
                            onChange={(e) =>
                              handlePracticeChange(index, 'customDrill', e.target.value)
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            placeholder="輸入自訂練習內容"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            練習備註（選填）
                          </label>
                          <textarea
                            value={practice.practiceNotes || ''}
                            onChange={(e) =>
                              handlePracticeChange(index, 'practiceNotes', e.target.value)
                            }
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                            rows={2}
                            placeholder="輸入練習備註"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 能力類別篩選 */}
            <div className="bg-white dark:bg-zinc-800/50 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">能力評分</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedCategory === ''
                      ? 'bg-primary text-white'
                      : 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  全部 ({abilities?.length || 0})
                </button>
                {categories.map((category) => {
                  const count = abilities?.filter((a) => a.category === category).length || 0;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        selectedCategory === category
                          ? 'bg-primary text-white'
                          : 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {category} ({count})
                    </button>
                  );
                })}
              </div>

              {/* 評分統計 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-background-light dark:bg-background-dark rounded-lg p-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">顯示能力數</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{filteredAbilities?.length || 0}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">已評分</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{Object.keys(ratings).length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">歷史記錄</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{latestRatings?.length || 0}</p>
                </div>
              </div>

              {/* 快速評分工具列 */}
              {filteredAbilities && filteredAbilities.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="h-5 w-5 text-blue-600 dark:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">快速評分</span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        ({selectedCategory || '全部'} {filteredAbilities.length} 項)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleQuickRateCategory('knew')}
                        className="px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-sm font-medium rounded-lg transition"
                      >
                        全部 ⭐ 認識
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickRateCategory('familiar')}
                        className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-lg transition"
                      >
                        全部 ⭐⭐ 熟悉
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickRateCategory('excellent')}
                        className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 text-sm font-medium rounded-lg transition"
                      >
                        全部 ⭐⭐⭐ 優秀
                      </button>
                      <button
                        type="button"
                        onClick={handleClearCategoryRatings}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 text-sm font-medium rounded-lg transition"
                        title="清除當前類別的所有評分"
                      >
                        清除評分
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                    💡 提示：點擊快速評分按鈕可批量設定{selectedCategory ? '當前類別' : '所有顯示'}的能力評分，之後仍可個別調整
                  </p>
                </div>
              )}

              {/* 能力列表 */}
              {filteredAbilities && filteredAbilities.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {filteredAbilities.reduce((acc, ability, index, array) => {
                    const currentRating = ratings[ability.id];
                    const previousRating = latestRatings?.find((r) => r.abilityId === ability.id);

                    // Add level header if this is a new skill level
                    const showLevelHeader = index === 0 || ability.skillLevel !== array[index - 1].skillLevel;

                    if (showLevelHeader) {
                      acc.push(
                        <div key={`level-${ability.skillLevel}`} className="sticky top-0 bg-zinc-100 dark:bg-zinc-700 border-l-4 border-primary px-4 py-2 font-semibold text-zinc-800 dark:text-zinc-200 z-10">
                          Level {ability.skillLevel}
                        </div>
                      );
                    }

                    acc.push(
                      <div
                        key={ability.id}
                        className={`border rounded-lg p-4 transition ${
                          currentRating ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/30'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-zinc-900 dark:text-white">{ability.name}</h3>
                            {ability.description && (
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{ability.description}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                              <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded">{ability.category}</span>
                              <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded">Level {ability.skillLevel}</span>
                            </div>
                            {previousRating && (
                              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700 rounded px-3 py-2">
                                <span className="font-medium">上次評分：</span>
                                {PROFICIENCY_LABELS[previousRating.proficiencyBand]}
                                {previousRating.comment && (
                                  <span className="ml-2">- {previousRating.comment}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* 評分選擇 */}
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              評分等級（選填）
                            </label>
                            <div className="flex space-x-2">
                              {(['knew', 'familiar', 'excellent'] as const).map((band, index) => (
                                <button
                                  key={band}
                                  type="button"
                                  onClick={() =>
                                    handleRatingChange(ability.id, index + 1, band)
                                  }
                                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                                    currentRating?.proficiencyBand === band
                                      ? 'bg-primary text-white shadow-md'
                                      : 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                  }`}
                                >
                                  {PROFICIENCY_LABELS[band]}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 評論輸入 */}
                          {currentRating && (
                            <div>
                              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                評論（選填）
                              </label>
                              <input
                                type="text"
                                value={currentRating.comment}
                                onChange={(e) => handleCommentChange(ability.id, e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-700/50 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                placeholder="輸入評論..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );

                    return acc;
                  }, [] as JSX.Element[])}
                </div>
              ) : (
                <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                  {abilities ? '沒有找到能力項目' : '載入能力列表中...'}
                </p>
              )}
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={createRecord.isPending || createRatings.isPending || !mappingId}
                className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-zinc-400 dark:disabled:bg-zinc-600 text-white font-medium rounded-lg transition"
              >
                {createRecord.isPending || createRatings.isPending
                  ? '儲存中...'
                  : `完成並儲存${Object.keys(ratings).length > 0 ? ` (${Object.keys(ratings).length} 項評分)` : ''}`}
              </button>
            </div>

            {showSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-600 dark:text-green-400 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    記錄與評分已成功儲存！正在返回課程頁面...
                  </p>
                </div>
              </div>
            )}

            {(createRecord.isError || createRatings.isError) && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  儲存失敗：{(createRecord.error as any)?.response?.data?.message || (createRatings.error as any)?.response?.data?.message || '請稍後再試'}
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
