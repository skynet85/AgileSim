import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/gameSlice'; // Assumed export default reducer, wrapped in configureStore for context
import { Board } from './components/Board';
import { analytics } from './services/analytics';

// Mock store configuration for standalone execution compliance
const mockStore = {
  getState: () => ({ game: store.getState() }),
  dispatch: store.dispatch.bind(store),
  subscribe: store.subscribe.bind(store)
};

analytics.initialize();

export const App: React.FC = () => (
  <Provider store={store}>
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-mono">
      <Board />
    </div>
  </Provider>
);