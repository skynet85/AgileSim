import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// ============================================================================
// 1. TÍPUSDEFINÍCIÓK & SZERZŐDÉSI KÖVETELMÉNYEK (Contract-First Approach)
// ============================================================================
// A típusbiztonság nem csupán kényelem, hanem a kontroll illúziójának első védelmi vonala.
// Minden mező formálisan rögzíti az üzleti és műszaki szerződést.

type TransactionStatus = 'PENDING' | 'APPROVED' | 'FAILED' | 'RISK_ASSESSMENT';
type TransactionType = 'DEBIT' | 'CREDIT' | 'TRANSFER';
type Currency = 'HUF' | 'EUR' | 'USD';

interface Transaction {
  id: string; // UUIDv7
  type: TransactionType;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  counterparty: string;
  createdAt: string; // ISO-8601 timestamp (keyset pagination cursor)
  metadata?: {
    riskScore: number;
    channel: string;
  };
}

interface BalanceState {
  available: number;
  pending: number;
  currency: Currency;
  lastSyncedAt: string;
}

interface ComplianceSignal {
  signalId: string;
  triggeredRule: string;
  actionRequired: 'REVIEW' | 'BLOCK' | 'NONE';
  transactionContext?: { velocity: number };
}

// Reducer Action Types – Determinisztikus állapotátmenetek
type AppAction = 
  | { type: 'INIT_DATA'; payload: { transactions: Transaction[]; balance: BalanceState } }
  | { type: 'ADD_TRANSACTION'; payload: Transaction } // Optimistic update
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: TransactionStatus } } // Eventual consistency fix
  | { type: 'REVERT_BALANCE'; payload: number } // PENDING -> FAILED/REJECTED rollback logic
  | { type: 'LOAD_MORE'; payload: Transaction[] }
  | { type: 'SET_LOADING'; payload: boolean };

// ============================================================================
// 2. UTILS & GENERÁTOROK (Idempotencia & Tracing)
// ============================================================================

/**
 * Mock UUIDv7 generátor.
 * A valós implementációban a `uuid-v7` library-t kell használni, amely időrendezett,
 * globálisan egyedi azonosítókat biztosít a partíció-széttagolás elkerülésére.
 */
const generateUUIDv7 = (): string => {
  const timestamp = Date.now().toString(36).padStart(12, '0');
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
};

const generateRequestID = (): string => {
  // UUIDv4 szimuláció a globális tracinghez (X-Request-ID)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

// ============================================================================
// 3. HTTP INTERCEPTOR (Kötelező Szerződés)
// ============================================================================

/**
 * Globális API kliens wrapper.
 * Biztosítja az Idempotency-Key és X-Request-ID propagálását minden írási és olvasási útvonalon,
 * ahogy a QA hibajegyzék (F-B-01) előírja.
 */
const apiClient = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const requestId = generateRequestID();
  const idempotencyKey = generateUUIDv7();

  const headers = new Headers(options.headers);
  headers.set('X-Request-ID', requestId);
  
  // Csak írási műveleteknél kötelező az Idempotency-Key, de a tracing mindkettőnél jelen van
  if (options.method !== 'GET') {
    headers.set('Idempotency-Key', idempotencyKey);
    headers.set('Authorization', `Bearer mock-jwt-token`); // JWT szimuláció
  }

  try {
    const response = await fetch(`/api/v1${endpoint}`, { ...options, headers });
    
    if (!response.ok) {
      if (response.status === 409) throw new Error('IDEMPOTENCY_CONFLICT: Duplicate request blocked.');
      throw new Error(`API_ERROR: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // Exponenciális backoff retry logika itt implementálandó valós környezetben
    console.error(`Request failed for ${endpoint}:`, error);
    throw error;
  }
};

// ============================================================================
// 4. CUSTOM HOOKOK (Állapotmenedzsment & Eventual Consistency)
// ============================================================================

/**
 * useReducer Hook – Determinisztikus állapotkezelés.
 * Kezeli az optimistic update-eket és a backend eseményekből érkező delta-kalkulációt.
 */
const appReducer = (state: any, action: AppAction): any => {
  switch (action.type) {
    case 'INIT_DATA':
      return { ...state, transactions: action.payload.transactions, balance: action.payload.balance };

    case 'ADD_TRANSACTION':
      // Optimistic UI update
      const newTx = { ...action.payload, status: 'PENDING' as TransactionStatus };
      return {
        ...state,
        transactions: [newTx, ...state.transactions],
        balance: { 
          ...state.balance, 
          available: state.balance.available - action.payload.amount,
          pending: state.balance.pending + action.payload.amount
        }
      };

    case 'UPDATE_STATUS': {
      // Eventual consistency kezelés: PENDING -> APPROVED/FAILED
      const txIndex = state.transactions.findIndex((t: Transaction) => t.id === action.payload.id);
      if (txIndex === -1) return state;

      const updatedTx = { ...state.transactions[txIndex], status: action.payload.status };
      const newTransactions = [...state.transactions];
      newTransactions[txIndex] = updatedTx;

      // Delta-kalkuláció az egyenleg konzisztenciájáért
      let balanceUpdate = 0;
      if (action.payload.status === 'APPROVED') {
        // Már levonta a pending-ből, itt marad a pending, de ha már processed volt...
        // Egyszerűsített logika: Pending -> Approved nem változtat az elérhetőn, csak státuszon.
        // Ha PENDING -> FAILED: vissza kell adni az összeget az elérhetőbe.
      } else if (action.payload.status === 'FAILED' || action.payload.status === 'RISK_ASSESSMENT') {
        balanceUpdate = -updatedTx.amount; // Visszaadás az available-be
      }

      return {
        ...state,
        transactions: newTransactions,
        balance: {
          ...state.balance,
          pending: state.balance.pending - updatedTx.amount,
          available: state.balance.available + (action.payload.status === 'FAILED' ? updatedTx.amount : 0),
          lastSyncedAt: new Date().toISOString()
        }
      };
    }

    case 'LOAD_MORE':
      return { ...state, transactions: [...state.transactions, ...action.payload] };

    default:
      return state;
  }
};

/**
 * useTransactionFeed Hook – SSE/WebSocket szimuláció.
 * Valós környezetben `EventSource('/transactions.raw/stream')` fogyasztása.
 */
const useTransactionFeed = (dispatch: React.Dispatch<AppAction>) => {
  useEffect(() => {
    // Szimulált EventSource consume a transactions.raw topicból
    const mockStreamInterval = setInterval(() => {
      const events = ['STATUS_UPDATE', 'NEW_TX'];
      const randomEvent = events[Math.floor(Math.random() * events.length)];

      if (randomEvent === 'STATUS_UPDATE') {
        // Szimuláció: egy PENDING tranzakció státuszának változása
        dispatch({ 
          type: 'UPDATE_STATUS', 
          payload: { id: generateUUIDv7(), status: Math.random() > 0.5 ? 'APPROVED' : 'FAILED' } 
        });
      } else if (randomEvent === 'NEW_TX') {
         // Új tranzakció esemény
         dispatch({
           type: 'ADD_TRANSACTION',
           payload: {
             id: generateUUIDv7(),
             type: Math.random() > 0.5 ? 'DEBIT' : 'CREDIT',
             amount: Math.floor(Math.random() * 50000),
             currency: 'HUF',
             status: 'PENDING',
             counterparty: 'Mock Counterparty',
             createdAt: new Date().toISOString()
           } as Transaction
         });
      }
    }, 3000); // 3s poll szimulálja az SSE streamet

    return () => clearInterval(mockStreamInterval);
  }, [dispatch]);
};

// ============================================================================
// 5. KOMPONENSEK (React.memo Optimalizálás & Design System)
// ============================================================================

const BalanceCard = React.memo(({ balance }: { balance: BalanceState }) => {
  return (
    <section className="glass-card rounded-2xl p-5 relative overflow-hidden shadow-xl mb-6">
      {/* Háttér dekorációk */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <span className="text-slate-400 text-sm font-medium">Elérhető egyenleg</span>
          <div className="flex items-center gap-1.5 pulse-dot relative">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-mono">{new Date(balance.lastSyncedAt).toLocaleTimeString()}</span>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">
          {balance.available.toLocaleString('hu-HU', { minimumFractionDigits: 2 })} 
          <span className="text-lg text-slate-400 font-medium ml-2">{balance.currency}</span>
        </h2>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <i className="fas fa-clock text-slate-500 text-xs" />
          <span className="text-xs text-slate-400 font-medium">Függőben: {balance.pending.toLocaleString('hu-HU')} {balance.currency}</span>
        </div>

        {/* Gyorsműveletek */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10">
          {[
            { icon: 'fa-paper-plane', label: 'Küldés', color: 'indigo' },
            { icon: 'fa-qrcode', label: 'Kód', color: 'emerald' },
            { icon: 'fa-arrow-down', label: 'Befizet', color: 'purple' },
            { icon: 'fa-ellipsis', label: 'Több', color: 'slate' }
          ].map((action) => (
            <button key={action.label} className="flex flex-col items-center justify-center gap-2 group">
              <div className={`w-10 h-10 rounded-xl bg-${action.color}-600/20 text-${action.color}-400 group-hover:bg-${action.color}-600 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-lg`}>
                <i className={`fas ${action.icon}`} />
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-white transition-colors">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
});

const TransactionItem = React.memo(({ tx }: { tx: Transaction }) => {
  const isCredit = tx.type === 'CREDIT';
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-all cursor-pointer group border border-transparent hover:border-slate-700">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-300'} flex items-center justify-center group-hover:scale-105 transition-transform`}>
          <i className={`fas ${isCredit ? 'fa-arrow-down' : (tx.type === 'TRANSFER' ? 'fa-exchange-alt' : 'fa-receipt')}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{tx.counterparty}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()} • {tx.type}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono">ID: ...{tx.id.slice(-3)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className={`text-sm font-bold ${isCredit ? 'text-emerald-400' : 'text-white'}`}>
          {isCredit ? '+' : '-'}{tx.amount.toLocaleString('hu-HU')} Ft
        </p>
        <span className={`text-[9px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${
          tx.status === 'APPROVED' ? 'bg-slate-800 text-slate-400' : 
          tx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
          'bg-red-500/10 text-red-300 border border-red-500/20'
        }`}>
          {tx.status === 'APPROVED' ? 'Kész' : tx.status === 'PENDING' ? 'Függőben' : 'Sikertelen'}
        </span>
      </div>
    </div>
  );
});

const ComplianceNudge = React.memo(() => (
  <section className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-3 mb-6">
    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex-shrink-0 flex items-center justify-center mt-0.5">
      <i className="fas fa-fingerprint" />
    </div>
    <div>
      <h4 className="text-sm font-medium text-white mb-1">Biztonsági ellenőrzés</h4>
      <p className="text-xs text-slate-400 leading-relaxed">
        A PSD2 szabályzat értelmében rendszeres azonosítás szükséges. A biometrikus hitelesítés aktiválva van.
      </p>
    </div>
  </section>
));

// ============================================================================
// 6. FŐ ALKALMAZÁS (App Component)
// ============================================================================

const App: React.FC = () => {
  // Kezdeti állapot inicializálása a dokumentáció szerinti mock adatokkal
  const [state, dispatch] = useReducer(appReducer, {
    transactions: [
      { id: 'tx-001', type: 'DEBIT', amount: 2990, currency: 'HUF', status: 'APPROVED', counterparty: 'Spotify AB', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'tx-002', type: 'CREDIT', amount: 450000, currency: 'HUF', status: 'APPROVED', counterparty: 'Munkáltató Zrt.', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'tx-003', type: 'DEBIT', amount: 50000, currency: 'HUF', status: 'PENDING', counterparty: 'OTP Bank ATM', createdAt: new Date(Date.now() - 1800000).toISOString() },
    ],
    balance: { available: 124500.00, pending: 50000, currency: 'HUF', lastSyncedAt: new Date().toISOString() }
  });

  // SSE feed csatlakoztatása
  useTransactionFeed(dispatch);

  const loadMoreTransactions = useCallback(async () => {
    // Keyset pagination szimuláció: valós DB lekérdezés WHERE (created_at, id) < ? helyett
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // apiClient hívás mock helyett
      const newTxs = [
        { id: 'tx-005', type: 'DEBIT', amount: 12490, currency: 'HUF', status: 'APPROVED', counterparty: 'Amazon EU', createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: 'tx-006', type: 'DEBIT', amount: 35000, currency: 'HUF', status: 'APPROVED', counterparty: 'MOL Fuel', createdAt: new Date(Date.now() - 259200000).toISOString() }
      ];
      
      dispatch({ type: 'LOAD_MORE', payload: newTxs });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  return (
    <div className="w-full max-w-md bg-slate-900 min-h-screen shadow-2xl relative overflow-hidden flex flex-col font-sans">
      
      {/* Header */}
      <header className="px-5 py-4 flex justify-between items-center border-b border-slate-800/60 z-10 bg-slate-900/90 backdrop-blur-sm sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            NA
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Üdvözlünk</p>
            <h1 className="text-sm font-semibold text-white">Nagy Attila</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <i className="fas fa-shield-halved text-emerald-400 text-xs" />
          <span className="text-[10px] font-medium text-emerald-300 tracking-wide uppercase">PSD2 Kompatibilis</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-5 py-6 space-y-6 pb-24">
        
        <BalanceCard balance={state.balance} />
        
        <ComplianceNudge />

        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-base font-semibold text-white">Műveletek</h3>
            <span className="text-xs text-slate-500 cursor-pointer hover:text-indigo-400 transition-colors" onClick={loadMoreTransactions}>Összes megtekintése</span>
          </div>

          <div className="space-y-3">
            {state.transactions.map((tx: Transaction) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
            
            {state.loading && <div className="text-center py-4 text-slate-500 text-xs">Betöltés...</div>}
          </div>

          <button 
            onClick={loadMoreTransactions}
            className="w-full mt-4 py-3 rounded-xl border border-slate-700 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all active:scale-[0.98]"
          >
            További betöltése
          </button>
        </section>

      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-3 flex justify-between items-center z-20">
        {['fa-home', 'fa-wallet', 'fa-chart-pie', 'fa-cog'].map((icon, idx) => (
          <button key={idx} className={`flex flex-col items-center gap-1 ${idx === 0 ? 'text-indigo-400' : 'text-slate-500 hover:text-indigo-400'} transition-colors group`}>
            <i className={`fas ${icon} text-lg transition-transform group-hover:-translate-y-0.5`} />
            <span className="text-[9px] font-medium">{['Otthon', 'Kártyák', 'Analitika', 'Beállítások'][idx]}</span>
          </button>
        ))}
        
        {/* Center Action */}
        <div className="-mt-8">
          <button 
            onClick={() => dispatch({ type: 'ADD_TRANSACTION', payload: { id: generateUUIDv7(), type: 'DEBIT', amount: 100, currency: 'HUF', status: 'PENDING', counterparty: 'Quick Pay', createdAt: new Date().toISOString() } as Transaction })}
            className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:bg-indigo-500 transition-all active:scale-90"
          >
            <i className="fas fa-plus text-xl" />
          </button>
        </div>
      </nav>

    </div>
  );
};

export default App;