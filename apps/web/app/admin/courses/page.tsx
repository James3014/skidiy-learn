'use client';

import { useState } from 'react';

interface Course {
  id: number;
  date: string;
  instructor: string;
  seatsOccupied: number;
  totalSeats: number;
  status: 'pending' | 'completed' | 'ended';
}

export default function AdminCoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedResort, setSelectedResort] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Mock data
  const courses: Course[] = [
    {
      id: 1,
      date: '2024/12/25',
      instructor: '王大明',
      seatsOccupied: 4,
      totalSeats: 6,
      status: 'pending',
    },
    {
      id: 2,
      date: '2024/12/26',
      instructor: '陳小美',
      seatsOccupied: 6,
      totalSeats: 6,
      status: 'completed',
    },
    {
      id: 3,
      date: '2024/01/15',
      instructor: '李教練團隊',
      seatsOccupied: 6,
      totalSeats: 6,
      status: 'ended',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-600 ring-yellow-500/20';
      case 'completed':
        return 'bg-green-500/20 text-green-600 ring-green-500/20';
      case 'ended':
        return 'bg-gray-400/20 text-gray-500 ring-gray-400/20';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '未評量';
      case 'completed':
        return '已評量';
      case 'ended':
        return '已結束';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A2540]">
      {/* Top App Bar */}
      <div className="flex items-center justify-between sticky top-0 z-10 shadow-sm bg-gray-50 dark:bg-[#0A2540] p-4 pb-2">
        <button className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          課程管理
        </h1>
        <button className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined">add_circle_outline</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 space-y-4 bg-gray-50 dark:bg-[#0A2540]">
        {/* Search Bar */}
        <label className="flex flex-col min-w-40 h-12 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full shadow-sm">
            <div className="text-gray-600 dark:text-gray-400 flex border-none bg-white dark:bg-[#334155] items-center justify-center pl-4 rounded-l-lg border-r-0">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-blue-500 border-none bg-white dark:bg-[#334155] h-full placeholder:text-gray-600 dark:placeholder:text-gray-400 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
              placeholder="搜尋課程"
            />
          </div>
        </label>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="form-select w-full h-10 rounded-lg bg-white dark:bg-[#334155] text-gray-600 dark:text-gray-400 text-sm font-medium border-none shadow-sm appearance-none pl-4 pr-8"
            >
              <option value="" disabled>
                時間範圍
              </option>
              <option>今天</option>
              <option>本週</option>
              <option>本月</option>
              <option>自訂日期範圍</option>
            </select>
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              keyboard_arrow_down
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedInstructor}
              onChange={(e) => setSelectedInstructor(e.target.value)}
              className="form-select w-full h-10 rounded-lg bg-white dark:bg-[#334155] text-gray-600 dark:text-gray-400 text-sm font-medium border-none shadow-sm appearance-none pl-4 pr-8"
            >
              <option value="" disabled>
                教練
              </option>
              <option>王大明</option>
              <option>陳小美</option>
              <option>李教練團隊</option>
            </select>
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              keyboard_arrow_down
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedResort}
              onChange={(e) => setSelectedResort(e.target.value)}
              className="form-select w-full h-10 rounded-lg bg-white dark:bg-[#334155] text-gray-600 dark:text-gray-400 text-sm font-medium border-none shadow-sm appearance-none pl-4 pr-8"
            >
              <option value="" disabled>
                雪場
              </option>
              <option>野澤溫泉</option>
              <option>苗場</option>
              <option>藏王溫泉</option>
            </select>
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              keyboard_arrow_down
            </span>
          </div>

          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-select w-full h-10 rounded-lg bg-white dark:bg-[#334155] text-gray-600 dark:text-gray-400 text-sm font-medium border-none shadow-sm appearance-none pl-4 pr-8"
            >
              <option value="" disabled>
                課程狀態
              </option>
              <option>未評量</option>
              <option>已評量</option>
            </select>
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              keyboard_arrow_down
            </span>
          </div>
        </div>
      </div>

      {/* Course Cards */}
      <div className="flex-1 p-4 space-y-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className={`p-4 bg-white dark:bg-[#334155] rounded-xl shadow-md ${
              course.status === 'ended' ? 'opacity-70' : ''
            }`}
          >
            <div className="flex flex-col items-stretch justify-start">
              <div className="flex w-full flex-col items-stretch justify-center gap-2">
                {/* More Options Button */}
                <div className="flex justify-end items-start">
                  <button className="text-gray-600 dark:text-gray-400 -mr-2 -mt-2">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                  <span className="material-symbols-outlined text-base">calendar_today</span>
                  <p>{course.date}</p>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                  <span className="material-symbols-outlined text-base">person</span>
                  <p>教練：{course.instructor}</p>
                </div>

                {/* Seats and Status */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
                      groups
                    </span>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      {course.seatsOccupied} / {course.totalSeats}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusColor(
                      course.status
                    )}`}
                  >
                    {getStatusLabel(course.status)}
                  </span>
                </div>

                {/* Action Button */}
                <button
                  className={`mt-4 flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-medium leading-normal shadow-sm transition-colors ${
                    course.status === 'ended'
                      ? 'bg-gray-400 text-white'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  disabled={course.status === 'ended'}
                >
                  <span className="truncate">
                    {course.status === 'ended' ? '查看詳情' : '管理席位'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10">
              <span className="material-symbols-outlined text-blue-500 text-4xl">upcoming</span>
            </div>
            <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">尚無課程</h2>
            <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
              開始建立您的第一堂滑雪課程吧！
            </p>
            <button className="mt-8 flex mx-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-orange-500 text-white text-base font-medium leading-normal shadow-lg hover:bg-orange-600 transition-colors">
              <span className="truncate">新增課程</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-20">
        <button className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-[#0A2540] transition-transform duration-200 ease-in-out hover:scale-105">
          <span className="material-symbols-outlined text-4xl">add</span>
        </button>
      </div>
    </div>
  );
}
