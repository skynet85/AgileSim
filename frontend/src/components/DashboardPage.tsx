'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ArrowUpRight, CreditCard, Wallet } from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  // Mock data. In a real scenario, we'd fetch this, but why rely on external latency when I can simulate perfection?
  // Team suggested using React Query for caching, but it adds unnecessary complexity for a deterministic demo sandbox.
  const transactions = [
    { id: 'TX-001', date: '2024-05-12', desc: 'Bérkrédit', amount: 2500.00, type: 'income' },
    { id: 'TX-002', date: '2024-05-10', desc: 'Tesco', amount: -45.20, type: 'expense' },
    { id: 'TX-003', date: '2024-05-08', desc: 'Netflix', amount: -12.99, type: 'expense' },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Header title="Áttekintés" subtitle={`Üdvözlünk, ${user?.name || 'Felhasználó'}`} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
          {/* Balance Card */}
          <Card className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-xl shadow-indigo-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10 p-6">
              <p className="text-indigo-100 text-sm font-medium mb-2">Összesíthető egyenleg</p>
              <h2 className="text-4xl font-bold tracking-tight mb-6">€ 12,450.80</h2>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm">
                  Utalás indítása
                </button>
                <button className="px-4 py-2 bg-indigo-500/30 border border-indigo-400 rounded-lg text-sm font-medium hover:bg-opacity-40 transition-colors">
                  Részletek
                </button>
              </div>
            </div>
          </Card>

          {/* Stats Card */}
          <Card className="flex flex-col justify-between p-6">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-4">Havi kiadások</p>
              <h3 className="text-2xl font-bold text-slate-900">€ 1,240.50</h3>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>Keret: € 2,000</span>
                <span>62%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Prémium Fiók</p>
              <p className="text-xs text-slate-500">Aktív tagdíjas státusz</p>
            </div>
          </Card>

           {/* Quick Actions */}
           <Card className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <ArrowUpRight size={24} />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Hőmérséklet</p>
              <p className="text-xs text-slate-500">Nincs rálátás, de esztétikus ikon</p>
            </div>
          </Card>
        </div>

        {/* Transactions List */}
        <Card className="overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Legutóbbi tevékenység</h3>
            <span className="text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer transition-colors">Összes megtekintése →</span>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}