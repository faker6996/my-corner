'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useTokenRefresh } from '@/lib/hooks/useTokenRefresh';

interface TokenRefreshContextValue {
  refreshToken: () => Promise<boolean>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  isRefreshing: boolean;
}

const TokenRefreshContext = createContext<TokenRefreshContextValue | null>(null);

interface TokenRefreshProviderProps {
  children: ReactNode;
  refreshInterval?: number;
}

export function TokenRefreshProvider({ 
  children, 
  refreshInterval = 12 * 60 * 1000 // 12 minutes
}: TokenRefreshProviderProps) {
  const tokenRefresh = useTokenRefresh({
    refreshInterval,
    onRefreshSuccess: () => {
      console.log('✅ Token refresh successful');
    },
    onRefreshError: (error) => {
      console.error('❌ Token refresh error:', error.message);
    }
  });

  return (
    <TokenRefreshContext.Provider value={tokenRefresh}>
      {children}
    </TokenRefreshContext.Provider>
  );
}

export function useTokenRefreshContext() {
  const context = useContext(TokenRefreshContext);
  if (!context) {
    throw new Error('useTokenRefreshContext must be used within TokenRefreshProvider');
  }
  return context;
}