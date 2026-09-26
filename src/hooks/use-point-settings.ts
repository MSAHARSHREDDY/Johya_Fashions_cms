import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PointSettings, getPointSettings, fetchPointSettingsRemote, calculateRewards } from '@/lib/settings';

export function usePointSettings() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<PointSettings>(getPointSettings);

  const { data: settings = localSettings, isLoading, refetch } = useQuery({
    queryKey: ['point-settings'],
    queryFn: fetchPointSettingsRemote,
    initialData: getPointSettings,
    staleTime: 0, // Immediately react to invalidation and keep UI always in sync
  });

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PointSettings>;
      if (customEvent.detail) {
        setLocalSettings(customEvent.detail);
        queryClient.setQueryData(['point-settings'], customEvent.detail);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'johya_point_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setLocalSettings(parsed);
          queryClient.setQueryData(['point-settings'], parsed);
        } catch (err) {}
      }
    };

    window.addEventListener('johya_point_settings_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('johya_point_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [queryClient]);

  const computePoints = useCallback((amount: number) => {
    return calculateRewards(amount, settings);
  }, [settings]);

  return {
    settings,
    isLoading,
    refetch,
    computePoints,
  };
}
