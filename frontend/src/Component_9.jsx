import { create } from 'zustand';
export interface Transaction { id: string; date: string; amount: number; description: string; status: 'completed' | 'pending'; }
interface TxState { transactions: Transaction[]; loadHistory: () => void; simulateTransfer: (to: string, amt: number) => Promise<boolean>; }
export const useTxStore = create<TxState>((set) => ({
  transactions: [],
  loadHistory: async () => set({ transactions: [
    { id: 'TX-01', date: new Date().toISOString(), amount: -45.20, description: 'Tesco', status: 'completed' },
    { id: 'TX-02', date: new Date().toISOString(), amount: 2500.00, description: 'Bérkrédit', status: 'completed' }
  ]}),
  simulateTransfer: async (to, amt) => { if (amt <= 0 || !to) return false; 
    const newTx = { id: `TX-${Date.now()}`, date: new Date().toISOString(), amount: -amt, description: to, status: 'pending' };
    set((s) => ({ transactions: [newTx, ...s.transactions] })); return true; },
}));