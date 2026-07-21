import { create } from 'zustand';

export interface Transaction { 
  id: string; 
  date: string; 
  amount: number; 
  description: string; 
  status: 'completed' | 'pending'; 
}

interface TxState { 
  transactions: Transaction[]; 
  loading: boolean; 
  error: string | null; 
  loadHistory: () => Promise<void>; 
  simulateTransfer: (to: string, amt: number) => Promise<boolean>; 
}

export const useTxStore = create<TxState>((set) => ({
  transactions: [], 
  loading: false, 
  error: null,
  
  loadHistory: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('http://localhost:8081/api/transactions');
      if (!res.ok) throw new Error('Failed to load transactions');
      const data = await res.json();
      const mapped: Transaction[] = data.map((tx: any) => ({
        id: tx.id, 
        date: tx.date, 
        amount: tx.amount, 
        description: tx.desc || tx.description, 
        status: tx.status as 'completed'|'pending'
      }));
      set({ transactions: mapped });
    } catch (err: any) {
      console.warn('Backend nem elérhető, mock fallback aktiválva.', err);
      set({ 
        transactions: [
          { id: 'TX-01', date: new Date().toISOString(), amount: -45.20, description: 'Tesco', status: 'completed' },
          { id: 'TX-02', date: new Date().toISOString(), amount: 2500.00, description: 'Bérkrédit', status: 'completed' }
        ] 
      });
    } finally {
      set({ loading: false });
    }
  },

  simulateTransfer: async (to, amt) => { 
    if (!to || isNaN(amt) || amt <= 0) return false; 
    
    const newTx: Transaction = { 
      id: `TX-${Date.now()}`, 
      date: new Date().toISOString(), 
      amount: -amt, 
      description: to, 
      status: 'pending' 
    };
    
    try {
      await fetch('http://localhost:8081/api/transactions', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(newTx)
      });
    } catch { /* Demo fallback */ }

    set((prev) => ({ transactions: [newTx, ...prev.transactions] })); 
    return true; 
  },
}));