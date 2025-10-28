'use client';

import Link from 'next/link';
import { useState } from 'react';

type UserRole = 'instructor' | 'student' | 'admin' | null;

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);

  const roles = [
    {
      id: 'instructor' as const,
      name: '教練',
      icon: 'school',
      description: '管理課程、評分學生、查看教學記錄',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
    {
      id: 'student' as const,
      name: '學生',
      icon: 'person',
      description: '領取座位、課前自評、查看評量結果',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
    {
      id: 'admin' as const,
      name: '管理員',
      icon: 'admin_panel_settings',
      description: '系統設定、報表分析、資料維護',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
    },
  ];

  const instructorPages = [
    { path: '/login-test', name: '測試登入', icon: 'login' },
    { path: '/lessons', name: '課程列表', icon: 'list' },
  ];

  const studentPages = [
    { path: '/claim', name: '領取座位', icon: 'confirmation_number' },
    { path: '/self-eval', name: '課前自評', icon: 'rate_review' },
  ];

  const adminPages = [
    { path: '/admin/dictionary', name: '字典維護', icon: 'menu_book' },
    { path: '/admin/reports', name: '報表與分析', icon: 'analytics' },
    { path: '/admin/courses', name: '課程管理', icon: 'event' },
  ];

  const getPagesByRole = (role: UserRole) => {
    switch (role) {
      case 'instructor':
        return instructorPages;
      case 'student':
        return studentPages;
      case 'admin':
        return adminPages;
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                DIY Ski 評量系統
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                滑雪教練教學評量與學生進度追蹤系統
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                v1.0-beta
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Role Selection or Pages */}
        {!selectedRole ? (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                選擇您的角色
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                請選擇您要使用的功能模組
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`${role.color} ${role.hoverColor} text-white rounded-2xl shadow-lg p-8 transition-all duration-200 hover:scale-105 hover:shadow-xl`}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-white/20 rounded-full p-4">
                      <span className="material-symbols-outlined text-5xl">
                        {role.icon}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold">{role.name}</h3>
                    <p className="text-sm opacity-90">{role.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {roles.find((r) => r.id === selectedRole)?.name}功能
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  選擇要進入的功能頁面
                </p>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span>返回</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getPagesByRole(selectedRole).map((page) => (
                <Link
                  key={page.path}
                  href={page.path}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-3 group-hover:bg-blue-500 dark:group-hover:bg-blue-600 transition-colors">
                      <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-300 group-hover:text-white">
                        {page.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {page.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {page.path}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-blue-500 transition-colors">
                      arrow_forward
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* System Info */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            系統資訊
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">後端 API</p>
              <p className="font-mono text-gray-900 dark:text-white">
                http://localhost:3001/api
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">前端</p>
              <p className="font-mono text-gray-900 dark:text-white">
                http://localhost:3003
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">API 文件</p>
              <p className="font-mono text-gray-900 dark:text-white">
                http://localhost:3001/api-docs
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>DIY Ski 評量系統 © 2024-2025</p>
          <p className="mt-1">採用 Next.js 14 + NestJS 10 + PostgreSQL 16 開發</p>
        </div>
      </footer>
    </div>
  );
}
