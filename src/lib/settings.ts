export interface PointSettings {
  minAmount: number;
  basePoints?: number;
  incrementAmount: number;
  pointsPerIncrement: number;
}

export const DEFAULT_SETTINGS: PointSettings = {
  minAmount: 1000,
  basePoints: 50,
  incrementAmount: 500,
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
      memorySettings = {
        minAmount: Number(parsed.minAmount) || DEFAULT_SETTINGS.minAmount,
        basePoints: parsed.basePoints !== undefined ? Number(parsed.basePoints) : (Number(parsed.pointsPerIncrement) || DEFAULT_SETTINGS.basePoints!),
        incrementAmount: Math.max(1, Number(parsed.incrementAmount) || DEFAULT_SETTINGS.incrementAmount),
        pointsPerIncrement: Number(parsed.pointsPerIncrement) || DEFAULT_SETTINGS.pointsPerIncrement,
      };
      return memorySettings;
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_SETTINGS;
};

export const savePointSettings = (settings: PointSettings) => {
  const clean: PointSettings = {
    minAmount: Math.max(0, Number(settings.minAmount) || 0),
    basePoints: settings.basePoints !== undefined ? Math.max(0, Number(settings.basePoints) || 0) : Math.max(0, Number(settings.pointsPerIncrement) || 0),
    incrementAmount: Math.max(1, Number(settings.incrementAmount) || 1),
    pointsPerIncrement: Math.max(0, Number(settings.pointsPerIncrement) || 0),
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
      const remoteSettings: PointSettings = {
        minAmount: Number(data.data.minAmount) ?? DEFAULT_SETTINGS.minAmount,
        basePoints: Number(data.data.basePoints ?? data.data.pointsPerIncrement ?? DEFAULT_SETTINGS.basePoints),
        incrementAmount: Math.max(1, Number(data.data.incrementAmount) || DEFAULT_SETTINGS.incrementAmount),
        pointsPerIncrement: Number(data.data.pointsPerIncrement) ?? DEFAULT_SETTINGS.pointsPerIncrement,
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
  savePointSettings(settings);
  try {
    const res = await fetch('/api/settings/points', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (data.success && data.data) {
      savePointSettings(data.data);
      return { success: true, data: data.data };
    }
    return { success: false, message: data.message || 'Failed to save to server' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error' };
  }
};

export const calculateRewards = (amount: number, customSettings?: PointSettings): number => {
  const s = customSettings || getPointSettings();
  const numAmount = Number(amount) || 0;
  const spendAmount = Math.max(1, Number(s.minAmount) || 1000);
  const pointsEarned = Math.max(0, Number(s.basePoints) || 50);

  if (numAmount <= 0) return 0;
  
  // Proportional points calculation: (Amount Spent / Spend Target) * Points Earned
  return Math.floor(numAmount * (pointsEarned / spendAmount));
};
