'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: '儀表板',
      icon: 'dashboard',
      path: '/lessons',
      active: pathname === '/lessons' || pathname?.startsWith('/lessons/')
    },
    {
      label: '紀錄',
      icon: 'history',
      path: '/records',
      active: pathname === '/records' || pathname?.startsWith('/records/')
    },
    {
      label: '學生',
      icon: 'group',
      path: '/students',
      active: pathname === '/students' || pathname?.startsWith('/students/')
    }
  ];

  return (
    <div className="sticky bottom-0 left-0 right-0 h-20 bg-background-light dark:bg-background-dark border-t border-zinc-200 dark:border-zinc-800 mt-auto z-50">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`inline-flex flex-col items-center justify-center px-5 transition-colors ${
              item.active
                ? 'text-primary dark:text-primary'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-primary dark:hover:text-primary'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
