'use client';

import { useEffect } from 'react';
import { useTxStore } from '@/lib/store/transactionStore';
import { TransactionItem } from '@/components/ui/TransactionItem';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function TransactionsPage() {
  const transactions = useTxStore((state) => state.transactions);
  const loadHistory = useTxStore((state) => state.loadHistory);

  useEffect(() => {
    // Load data on mount. In a real app, we'd handle loading states, but this is a demo.
    if (transactions.length === 0) {
      loadHistory();
    }
  }, [loadHistory, transactions]);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Header title="Tranzakciók" subtitle="A fiók történetének áttekintése és elemzése." />
        
        <Card className="overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Tranzakciós előzmények</h3>
            {/* Filtering is disabled in demo mode to prevent scope creep */}
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-slate-600 hover:bg-gray-50 transition-colors flex items-center gap-2">
              Szűrés (Demo)
            </button>
          </div>
          
          <div className="divide-y divide-gray-50">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Nincsenek tranzakciók.</div>
            ) : (
              transactions.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}