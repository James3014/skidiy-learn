'use client';

import { useState } from 'react';

type DictionaryTab = 'abilities' | 'analysis' | 'practice' | 'resorts';

interface AbilityItem {
  id: number;
  name: string;
  category: string;
  sportType: string;
  skillLevel: number;
}

export default function AdminDictionaryPage() {
  const [activeTab, setActiveTab] = useState<DictionaryTab>('abilities');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - will be replaced with API calls
  const mockAbilities: AbilityItem[] = [
    { id: 1, name: 'S-Turn', category: 'turning', sportType: 'SKI', skillLevel: 1 },
    { id: 2, name: 'C-Turn', category: 'turning', sportType: 'SKI', skillLevel: 2 },
    { id: 3, name: 'Carving', category: 'advanced', sportType: 'SKI', skillLevel: 5 },
    { id: 4, name: 'Moguls', category: 'advanced', sportType: 'SKI', skillLevel: 7 },
  ];

  const tabs: { key: DictionaryTab; label: string }[] = [
    { key: 'abilities', label: '能力清單' },
    { key: 'analysis', label: '教學分析' },
    { key: 'practice', label: '練習項目' },
    { key: 'resorts', label: '雪場與雪道' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101c22]">
      {/* Top App Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101c22] p-4 pb-2">
        <button className="text-gray-700 dark:text-gray-200 flex size-12 shrink-0 items-center justify-center">
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          資料維護
        </h1>
        <button className="flex items-center justify-end">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-bold leading-normal tracking-[0.015em] shrink-0">
            變更記錄
          </p>
        </button>
      </div>

      {/* Tabs */}
      <div className="pb-3 bg-white dark:bg-[#101c22]">
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-4 gap-4 sm:gap-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-b-blue-500 text-blue-500'
                  : 'border-b-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              <p className="text-sm font-bold leading-normal tracking-[0.015em]">{tab.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Actions */}
      <div className="px-4 py-3 flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#101c22]">
        <div className="flex-1">
          <label className="flex flex-col min-w-40 h-12 w-full">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
              <div className="text-gray-600 dark:text-gray-400 flex border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 items-center justify-center pl-4 rounded-l-lg">
                <span className="material-symbols-outlined text-2xl">search</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 h-full placeholder:text-gray-600 dark:placeholder:text-gray-400 px-4 text-base font-normal leading-normal"
                placeholder="搜尋能力"
              />
            </div>
          </label>
        </div>
        <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-blue-500/20 text-blue-500 gap-2 text-sm font-bold leading-normal tracking-[0.015em] border border-blue-500/50 hover:bg-blue-500/30 transition-colors">
          <span className="material-symbols-outlined text-xl">upload_file</span>
          <span className="truncate">批次匯入</span>
        </button>
      </div>

      {/* List Items */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#101c22] px-4 pb-24">
        {mockAbilities
          .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((ability) => (
            <div
              key={ability.id}
              className="flex items-center gap-4 min-h-[72px] py-3 border-b border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="text-gray-900 dark:text-white flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0 size-12">
                  <span className="material-symbols-outlined text-2xl">snowboarding</span>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-gray-900 dark:text-white text-base font-medium leading-normal line-clamp-1">
                    {ability.name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2">
                    ID: SKI-{ability.id.toString().padStart(3, '0')} | 等級: {ability.skillLevel}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex gap-2">
                <button className="text-gray-600 dark:text-gray-400 flex size-9 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
                <button className="text-red-600 dark:text-red-400 flex size-9 items-center justify-center rounded-full hover:bg-red-600/20 transition-colors">
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            </div>
          ))}

        {/* Empty State */}
        {mockAbilities.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-600 dark:text-gray-400 mx-auto flex size-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              <span className="material-symbols-outlined text-4xl">inventory_2</span>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">沒有找到項目</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              請嘗試不同的搜尋關鍵字
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button className="flex items-center justify-center size-14 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors">
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </div>
    </div>
  );
}
