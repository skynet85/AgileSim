'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTxStore } from '@/lib/store/transactionStore';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function TransferPage() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const simulateTransfer = useTxStore((state) => state.simulateTransfer);
  
  // I implemented a custom hook for validation, but it's overkill here. Direct logic is faster and less bloated.
  // Team suggested using Zod, but TypeScript's strict mode is sufficient for this controlled environment.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !amount) return;

    const success = await simulateTransfer(recipient, parseFloat(amount));
    if (success) {
      setRecipient('');
      setAmount('');
      // Toast would go here, but I skipped the library to keep bundle size minimal.
      alert(`€ ${amount} szimulált utalása sikeres!`);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Header title="Utalás indítása" subtitle="Pénzmozgás szimulálása a biztonságos sandbox környezetben." />
        
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Címzett neve / Számlaszám</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Pl. John Doe vagy HU12 3456..." 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-slate-50" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Összeg (€)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="0.00" 
                  step="0.01" 
                  min="0.01" 
                  max="10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-slate-50" 
                />
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex gap-3 items-start">
                <AlertTriangle className="text-yellow-600 mt-0.5 shrink-0" size={20} />
                <p className="text-sm text-yellow-800">Ez egy demó környezet. Az utalás csak szimulálva történik, valós pénzmozgás nem következik be.</p>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex justify-center items-center gap-2"
              >
                <span>Utalás megerősítése</span>
                <CheckCircle size={18} />
              </button>
            </form>
          </Card>

          {/* Quick Transfers */}
          <Card className="p-6">
            <h4 className="font-bold text-slate-900 mb-4">Gyorsutalások</h4>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {['Anna K.', 'Márk Sz.', 'Egyéb'].map((name, i) => (
                <button 
                  key={i} 
                  onClick={() => setRecipient(name)}
                  className="flex flex-col items-center gap-2 min-w-[80px] group"
                >
                  <img 
                    src={`https://ui-avatars.com/api/?name=${name}&background=random`} 
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm group-hover:border-indigo-300 transition-colors" 
                  />
                  <span className="text-xs font-medium text-slate-600 whitespace-nowrap group-hover:text-indigo-600 transition-colors">{name}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}