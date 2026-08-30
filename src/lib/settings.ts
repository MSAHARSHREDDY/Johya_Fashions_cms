export interface PointSettings {
  minAmount: number;
  incrementAmount: number;
  pointsPerIncrement: number;
}

const DEFAULT_SETTINGS: PointSettings = {
  minAmount: 1000,
  incrementAmount: 500,
  pointsPerIncrement: 50
};

export const getPointSettings = (): PointSettings => {
  try {
    const saved = localStorage.getItem('johya_point_settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_SETTINGS;
};

export const savePointSettings = (settings: PointSettings) => {
  localStorage.setItem('johya_point_settings', JSON.stringify(settings));
};

export const calculateRewards = (amount: number, settings?: PointSettings): number => {
  const s = settings || getPointSettings();
  if (amount < s.minAmount) return 0;
  
  // Logic: "1000 rupee 50 points, for every 500 more add 50".
  // This translates to:
  // Math.floor((amount - minAmount) / incrementAmount) * pointsPerIncrement + pointsPerIncrement
  // Let's match the old logic exactly to ensure backward compatibility:
  // Old: Math.max(0, Math.floor(amount / 500) - 1) * 50
  // When amount=1000, 1000/500 - 1 = 1 * 50 = 50.
  // Using the settings:
  const incAmount = s.incrementAmount || 1;
  const increments = Math.floor((amount - s.minAmount) / incAmount);
  return (1 + increments) * s.pointsPerIncrement;
};
