export interface PointSettings {
  minAmount: number;
  basePoints: number;
  incrementAmount?: number;
  pointsPerIncrement?: number;
}

export const DEFAULT_SETTINGS: PointSettings = {
  minAmount: 1000,
  basePoints: 50,
  incrementAmount: 1000,
  pointsPerIncrement: 50,
};

let memorySettings: PointSettings | null = null;

export const getPointSettings = (): PointSettings => {
  if (memorySettings) {
    return memorySettings;
  }
  try {
    const saved = localStorage.getItem('johya_point_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      const points = parsed.basePoints !== undefined 
        ? Number(parsed.basePoints) 
        : (parsed.pointsPerIncrement !== undefined ? Number(parsed.pointsPerIncrement) : DEFAULT_SETTINGS.basePoints);
      const spend = Math.max(1, Number(parsed.minAmount) || DEFAULT_SETTINGS.minAmount);

      memorySettings = {
        minAmount: spend,
        basePoints: points,
        incrementAmount: spend,
        pointsPerIncrement: points,
      };
      return memorySettings;
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_SETTINGS;
};

export const savePointSettings = (settings: PointSettings) => {
  const spend = Math.max(1, Number(settings.minAmount) || DEFAULT_SETTINGS.minAmount);
  const points = Math.max(0, Number(settings.basePoints !== undefined ? settings.basePoints : (settings.pointsPerIncrement ?? DEFAULT_SETTINGS.basePoints)));

  const clean: PointSettings = {
    minAmount: spend,
    basePoints: points,
    incrementAmount: spend,
    pointsPerIncrement: points,
  };
  memorySettings = clean;
  try {
    localStorage.setItem('johya_point_settings', JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent('johya_point_settings_updated', { detail: clean }));
  } catch (e) {
    // ignore
  }
};

export const fetchPointSettingsRemote = async (): Promise<PointSettings> => {
  try {
    const res = await fetch('/api/settings/points');
    const data = await res.json();
    if (data.success && data.data) {
      const points = Number(data.data.basePoints ?? data.data.pointsPerIncrement ?? DEFAULT_SETTINGS.basePoints);
      const spend = Math.max(1, Number(data.data.minAmount) || DEFAULT_SETTINGS.minAmount);
      const remoteSettings: PointSettings = {
        minAmount: spend,
        basePoints: points,
        incrementAmount: spend,
        pointsPerIncrement: points,
      };
      savePointSettings(remoteSettings);
      return remoteSettings;
    }
  } catch (e) {
    console.error('Failed to load point settings from server, using local fallback:', e);
  }
  return getPointSettings();
};

export const savePointSettingsRemote = async (settings: PointSettings): Promise<{ success: boolean; data?: PointSettings; message?: string }> => {
  const spend = Math.max(1, Number(settings.minAmount) || DEFAULT_SETTINGS.minAmount);
  const points = Math.max(0, Number(settings.basePoints !== undefined ? settings.basePoints : (settings.pointsPerIncrement ?? DEFAULT_SETTINGS.basePoints)));
  const clean: PointSettings = {
    minAmount: spend,
    basePoints: points,
    incrementAmount: spend,
    pointsPerIncrement: points,
  };
  savePointSettings(clean);

  try {
    const res = await fetch('/api/settings/points', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clean),
    });
    const data = await res.json();
    if (data.success && data.data) {
      const serverClean: PointSettings = {
        minAmount: Number(data.data.minAmount) || spend,
        basePoints: Number(data.data.basePoints ?? data.data.pointsPerIncrement ?? points),
        incrementAmount: Number(data.data.incrementAmount) || spend,
        pointsPerIncrement: Number(data.data.pointsPerIncrement ?? data.data.basePoints ?? points),
      };
      savePointSettings(serverClean);
      return { success: true, data: serverClean };
    }
    return { success: true, data: clean, message: data.message || 'Saved locally' };
  } catch (e: any) {
    return { success: true, data: clean, message: 'Saved locally' };
  }
};

export const calculateRewards = (amount: number, customSettings?: PointSettings): number => {
  const s = customSettings || getPointSettings();
  const numAmount = Number(amount) || 0;
  const spendAmount = Math.max(1, Number(s.minAmount) || 1000);
  const pointsEarned = Math.max(0, Number(s.basePoints !== undefined ? s.basePoints : (s.pointsPerIncrement ?? 50)));

  if (numAmount <= 0) return 0;
  
  // Proportional points calculation: (Amount Spent / Spend Target) * Points Earned
  return Math.floor(numAmount * (pointsEarned / spendAmount));
};
