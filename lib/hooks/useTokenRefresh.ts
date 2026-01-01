'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { callApi } from '@/lib/utils/api-client';
import { HTTP_METHOD_ENUM } from '@/lib/constants/enum';
import { API_ROUTES } from '@/lib/constants/api-routes';

interface UseTokenRefreshOptions {
  refreshInterval?: number; // in milliseconds, default 12 minutes (3 minutes before expiry)
  onRefreshSuccess?: () => void;
  onRefreshError?: (error: Error) => void;
}

export function useTokenRefresh(options: UseTokenRefreshOptions = {}) {
  const {
    refreshInterval = 12 * 60 * 1000, // 12 minutes
    onRefreshSuccess,
    onRefreshError
  } = options;
  
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'vi';
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const refreshToken = async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      return false;
    }

    isRefreshingRef.current = true;

    try {
      await callApi<{ accessToken: string }>(API_ROUTES.AUTH.REFRESH, HTTP_METHOD_ENUM.POST, undefined, { silent: true });
      console.log('🔄 Token refreshed successfully');
      onRefreshSuccess?.();
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      onRefreshError?.(error as Error);
      
      // Redirect to login if refresh fails
      router.push(`/${locale}/login`);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const startAutoRefresh = () => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up auto-refresh interval
    intervalRef.current = setInterval(() => {
      console.log('🔄 Auto-refreshing token...');
      refreshToken();
    }, refreshInterval);

    console.log(`🚀 Auto-refresh started (every ${refreshInterval / 1000 / 60} minutes)`);
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ Auto-refresh stopped');
    }
  };

  // Manual refresh function
  const manualRefresh = () => {
    console.log('🔄 Manual token refresh triggered');
    return refreshToken();
  };

  // Start auto-refresh on mount
  useEffect(() => {
    startAutoRefresh();

    // Cleanup on unmount
    return () => {
      stopAutoRefresh();
    };
  }, [refreshInterval]);

  // Listen for visibility change to refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Tab became visible, checking token...');
        refreshToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    refreshToken: manualRefresh,
    startAutoRefresh,
    stopAutoRefresh,
    isRefreshing: isRefreshingRef.current
  };
}
