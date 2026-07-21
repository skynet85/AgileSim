'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, SendHorizontal, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore(s => s.logout);

  const navItems = [
    { name: 'Áttekintés', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tranzakciók', href: '/transactions', icon: CreditCard },
    { name: 'Utalás', href: '/transfer', icon: SendHorizontal },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-md border-r border-slate-200 p-6 z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-white shadow-md">
          <CreditCard size={20} />
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-800">NeoBank</span>
      </div>

      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <item.icon size={18} /> {item.name}
              </button>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-slate-200 mt-auto">
        <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
          <LogOut size={18} /> Kijelentkezés
        </button>
      </div>
    </aside>
  );
}