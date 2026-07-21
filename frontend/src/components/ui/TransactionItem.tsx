import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TransactionItemProps {
  transaction: { id: string; date: string; amount: number; description?: string; status?: string };
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isPositive = transaction.amount > 0;
  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
          {isPositive ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{transaction.description || 'Ismeretlen tranzakció'}</p>
          <p className="text-xs text-slate-400">{new Date(transaction.date).toLocaleDateString('hu-HU')}</p>
        </div>
      </div>
      <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-slate-900'}`}>
        {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} €
      </span>
    </div>
  );
}