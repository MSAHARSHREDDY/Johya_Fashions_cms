import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PointSettings, getPointSettings, fetchPointSettingsRemote, calculateRewards } from '@/lib/settings';

export function usePointSettings() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<PointSettings>(getPointSettings);

  const { data: settings = localSettings, isLoading, refetch } = useQuery({
    queryKey: ['point-settings'],
    queryFn: fetchPointSettingsRemote,
    initialData: getPointSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PointSettings>;
      if (customEvent.detail) {
        setLocalSettings(customEvent.detail);
        queryClient.setQueryData(['point-settings'], customEvent.detail);
      }
    };
    window.addEventListener('johya_point_settings_updated', handleUpdate);
    return () => window.removeEventListener('johya_point_settings_updated', handleUpdate);
  }, [queryClient]);

  const computePoints = (amount: number) => {
    return calculateRewards(amount, settings);
  };

  return {
    settings,
    isLoading,
    refetch,
    computePoints,
  };
}
