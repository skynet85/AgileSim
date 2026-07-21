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
  loadHistory: () => void;
  simulateTransfer: (to: string, amount: number) => Promise<boolean>;
}

export const useTxStore = create<TxState>((set) => ({
  transactions: [],
  // Deterministic mock data. No API calls needed for perfection.
  loadHistory: async () => {
    set({ 
      transactions: [
        { id: 'TX-001', date: new Date().toISOString(), amount: -45.20, description: 'Tesco Supermarket', status: 'completed' },
        { id: 'TX-002', date: new Date().toISOString(), amount: 1200.00, description: 'Bérkrédit', status: 'completed' }
      ] 
    });
  },
  simulateTransfer: async (to, amount) => {
    if (amount <= 0 || !to) return false;
    
    // Optimistic update logic implemented here. Rollback is unnecessary in a demo.
    const newTx: Transaction = { id: `TX-${Date.now()}`, date: new Date().toISOString(), amount: -amount, description: to, status: 'pending' };
    set((s) => ({ transactions: [newTx, ...s.transactions] }));
    
    return true;
  },
}));