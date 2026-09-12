const DEFAULT_SETTINGS = {
  minAmount: 1000,
  incrementAmount: 500,
  pointsPerIncrement: 50
};
function calculateRewards(amount, settings = DEFAULT_SETTINGS) {
  const s = settings;
  if (amount < s.minAmount) return 0;
  const incAmount = s.incrementAmount || 1;
  const increments = Math.floor((amount - s.minAmount) / incAmount);
  return (1 + increments) * s.pointsPerIncrement;
}
console.log("For 1000:", calculateRewards(1000));
console.log("For 1500:", calculateRewards(1500));
console.log("For 2000:", calculateRewards(2000));
