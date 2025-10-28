'use client';

import { useState } from 'react';

type ReportTab = 'instructor' | 'student' | 'resort';

interface InstructorStat {
  name: string;
  completed: number;
  total: number;
  completionRate: number;
}

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('instructor');
  const [dateRange, setDateRange] = useState('last-month');

  // Mock data
  const instructorStats: InstructorStat[] = [
    { name: '教練A', completed: 40, total: 40, completionRate: 100 },
    { name: '教練B', completed: 24, total: 40, completionRate: 60 },
    { name: '教練C', completed: 20, total: 40, completionRate: 50 },
    { name: '教練D', completed: 36, total: 40, completionRate: 90 },
  ];

  const overallCompletionRate = 88;
  const totalStudents = 1234;
  const popularResort = '雪世界';

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'instructor', label: '教練表現' },
    { key: 'student', label: '學生參與度' },
    { key: 'resort', label: '雪場使用率' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#101c22]">
      {/* Top App Bar */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-gray-100 dark:bg-[#101c22] p-4 pb-2">
        <button className="text-gray-700 dark:text-white flex size-12 shrink-0 items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          報表與分析
        </h1>
        <div className="flex w-12 items-center justify-end">
          <button className="text-blue-500 text-base font-bold leading-normal tracking-[0.015em] shrink-0">
            Export
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
        <label className="flex flex-col min-w-40 flex-1">
          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">
            Date Range
          </p>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-select flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#1c2327] focus:border-blue-500 h-14 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-[15px] text-base font-normal leading-normal"
          >
            <option value="last-month">Last Month</option>
            <option value="last-week">Last Week</option>
            <option value="custom">Custom Range</option>
          </select>
        </label>
      </div>

      {/* Tabs */}
      <div className="pb-3">
        <div className="flex border-b border-gray-300 dark:border-gray-600 px-4 justify-between">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 flex-1 ${
                activeTab === tab.key
                  ? 'border-b-blue-500 text-blue-500'
                  : 'border-b-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              <p className="text-sm font-bold leading-normal tracking-[0.015em]">{tab.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-4 p-4">
        <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1c2327]">
          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">
            教練總完成率
          </p>
          <p className="text-gray-900 dark:text-white tracking-light text-2xl font-bold leading-tight">
            {overallCompletionRate}%
          </p>
          <p className="text-green-500 text-base font-medium leading-normal">+5%</p>
        </div>
        <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1c2327]">
          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">
            學生總參與數
          </p>
          <p className="text-gray-900 dark:text-white tracking-light text-2xl font-bold leading-tight">
            {totalStudents.toLocaleString()}
          </p>
          <p className="text-green-500 text-base font-medium leading-normal">+120</p>
        </div>
        <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1c2327]">
          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">
            最受歡迎雪場
          </p>
          <p className="text-gray-900 dark:text-white tracking-light text-2xl font-bold leading-tight">
            {popularResort}
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex flex-wrap gap-4 px-4 py-6">
        <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-gray-300 dark:border-gray-600 p-6 bg-white dark:bg-[#1c2327]">
          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">
            教練完成率統計
          </p>
          <p className="text-gray-900 dark:text-white tracking-light text-[32px] font-bold leading-tight truncate">
            {overallCompletionRate}%
          </p>
          <div className="flex gap-1">
            <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
              Last 30 days
            </p>
            <p className="text-green-500 text-base font-medium leading-normal">+5%</p>
          </div>
          {/* Simple Bar Chart */}
          <div className="grid min-h-[180px] grid-flow-col gap-6 grid-rows-[1fr_auto] items-end justify-items-center px-3 pt-4">
            {instructorStats.map((stat) => (
              <div key={stat.name} className="contents">
                <div
                  className={`w-full rounded-t-md ${
                    stat.completionRate >= 90
                      ? 'bg-blue-500'
                      : stat.completionRate >= 60
                      ? 'bg-blue-500/40'
                      : 'bg-blue-500/20'
                  }`}
                  style={{ height: `${stat.completionRate}%` }}
                ></div>
                <p
                  className={`text-[13px] font-bold leading-normal tracking-[0.015em] ${
                    stat.completionRate >= 90
                      ? 'text-blue-500'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {stat.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="px-4 pb-6">
        <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1c2327]">
          <table className="w-full text-left text-sm text-gray-900 dark:text-white">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 font-medium" scope="col">
                  Coach Name
                </th>
                <th className="px-6 py-3 font-medium" scope="col">
                  Completed
                </th>
                <th className="px-6 py-3 font-medium" scope="col">
                  Total
                </th>
                <th className="px-6 py-3 font-medium" scope="col">
                  Completion %
                </th>
              </tr>
            </thead>
            <tbody>
              {instructorStats.map((stat) => (
                <tr key={stat.name} className="border-t border-gray-200 dark:border-gray-600">
                  <th
                    className={`px-6 py-4 font-medium whitespace-nowrap ${
                      stat.completionRate >= 90 ? 'text-blue-500' : ''
                    }`}
                    scope="row"
                  >
                    {stat.name}
                  </th>
                  <td className="px-6 py-4">{stat.completed}</td>
                  <td className="px-6 py-4">{stat.total}</td>
                  <td
                    className={`px-6 py-4 ${
                      stat.completionRate >= 90
                        ? 'text-blue-500'
                        : stat.completionRate < 60
                        ? 'text-red-600'
                        : ''
                    }`}
                  >
                    {stat.completionRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
