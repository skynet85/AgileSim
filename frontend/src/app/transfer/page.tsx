'use client';
import { useState, useEffect } from 'react'; 
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card'; 
import { Header } from '@/components/layout/Header'; 
import { Sidebar } from '@/components/layout/Sidebar'; 
import { useTxStore } from '@/lib/store/transactionStore'; 
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';

export default function Transfer() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [statusMsg, setStatusMsg] = useState<{type: 'success'|'error'|null; text: string}>({ type: null, text: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const simulate = useTxStore(s => s.simulateTransfer);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    setStatusMsg({ type: null, text: '' });
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg({ type: null, text: '' });
    
    if (!recipient.trim() || !amount || parseFloat(amount) <= 0) {
      setStatusMsg({ type: 'error', text: 'Kérlek, tölts ki minden mezőt érvényes értékkel!' });
      return;
    }

    setIsProcessing(true);
    const success = await simulate(recipient, parseFloat(amount));
    setIsProcessing(false);

    if (success) {
      setStatusMsg({ type: 'success', text: 'Az utalás sikeresen feldolgozva! (Demo)' });
      setRecipient('');
      setAmount('');
      setTimeout(() => router.push('/transactions'), 2000);
    } else {
      setStatusMsg({ type: 'error', text: 'Hiba történt az utalás során. Kérlek, ellenőrizd a mezőket.' });
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto max-w-2xl mx-auto w-full">
        <Header title="Utalás" subtitle="Biztonságos szimuláció" />
        <Card className="p-8 animate-fade-in">
          {statusMsg.type && (
            <div className={`mb-6 p-4 rounded-xl flex gap-3 items-start ${statusMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {statusMsg.type === 'success' ? <CheckCircle size={20} className="mt-0.5 shrink-0"/> : <AlertTriangle size={20} className="mt-0.5 shrink-0"/>}
              <div>
                <p className="font-semibold">{statusMsg.text}</p>
                {statusMsg.type === 'success' && <p className="text-sm mt-1 opacity-80">Átirányítás a tranzakciókhoz...</p>}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Címzett</label>
              <input type="text" required value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Név vagy számlaszám" className="w-full p-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Összeg (€)</label>
              <input type="number" required step="0.01" min="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="w-full p-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"/>
            </div>
            
            <div className="p-4 bg-yellow-50 text-yellow-800 flex gap-2 items-center rounded-lg border border-yellow-100">
              <AlertTriangle size={18}/> Demo környezet, nincs valós pénzmozgás.
            </div>

            <button type="submit" disabled={isProcessing} className={`w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg flex justify-center gap-2 transition-all ${isProcessing ? 'opacity-80 cursor-not-allowed' : ''}`}>
              {isProcessing ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18}/>}
              <span>{isProcessing ? 'Feldolgozás...' : 'Megerősítés & Utalás'}</span>
            </button>
          </form>
        </Card>
      </main>
    </div>
  );
}