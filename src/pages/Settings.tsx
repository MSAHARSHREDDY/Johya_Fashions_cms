import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  getPointSettings, 
  savePointSettings,
  fetchPointSettingsRemote, 
  savePointSettingsRemote, 
  calculateRewards, 
  PointSettings 
} from '@/lib/settings';
import { toast } from 'sonner';
import { Loader2, Calculator, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<PointSettings>(() => getPointSettings());

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [testAmount, setTestAmount] = useState<string>('1000');

  useEffect(() => {
    async function load() {
      setIsLoadingSettings(true);
      const data = await fetchPointSettingsRemote();
      setSettings(data);
      queryClient.setQueryData(['point-settings'], data);
      setIsLoadingSettings(false);
    }
    load();
  }, [queryClient]);

  const handleSave = async () => {
    setIsSaving(true);
    const spend = Math.max(1, Number(settings.minAmount) || 1000);
    const points = Math.max(0, Number(settings.basePoints !== undefined ? settings.basePoints : (settings.pointsPerIncrement ?? 50)));

    const cleanSettings: PointSettings = {
      minAmount: spend,
      basePoints: points,
      incrementAmount: spend,
      pointsPerIncrement: points,
    };

    setSettings(cleanSettings);
    savePointSettings(cleanSettings);
    queryClient.setQueryData(['point-settings'], cleanSettings);

    const res = await savePointSettingsRemote(cleanSettings);
    if (res.data) {
      setSettings(res.data);
      queryClient.setQueryData(['point-settings'], res.data);
    }
    queryClient.invalidateQueries({ queryKey: ['point-settings'] });

    setIsSaving(false);
    toast.success(`Point settings saved: ₹${spend.toLocaleString()} = ${points} points.`);
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const spend = Math.max(1, Number(settings.minAmount) || 1000);
      const points = Math.max(0, Number(settings.basePoints !== undefined ? settings.basePoints : (settings.pointsPerIncrement ?? 50)));

      const cleanSettings: PointSettings = {
        minAmount: spend,
        basePoints: points,
        incrementAmount: spend,
        pointsPerIncrement: points,
      };

      // Ensure latest settings are saved first
      await savePointSettingsRemote(cleanSettings);
      queryClient.setQueryData(['point-settings'], cleanSettings);
      queryClient.invalidateQueries({ queryKey: ['point-settings'] });

      const res = await fetch('/api/customers/recalculate-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanSettings),
      });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
        toast.success('All customer reward points recalculated successfully!');
      } else {
        toast.error('Failed to recalculate: ' + (data.message || ''));
      }
    } catch (e) {
      toast.error('Network error while recalculating points');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Safe numeric versions for display & calculation
  const currentSettings = useMemo<PointSettings>(() => ({
    minAmount: Math.max(0, Number(settings.minAmount) || 0),
    basePoints: Math.max(0, Number(settings.basePoints ?? settings.pointsPerIncrement) || 0),
    incrementAmount: Math.max(1, Number(settings.incrementAmount) || 1),
    pointsPerIncrement: Math.max(0, Number(settings.pointsPerIncrement) || 0),
  }), [settings]);

  const belowMin = Math.floor(currentSettings.minAmount / 2);
  const atMin = currentSettings.minAmount;
  const proportional = currentSettings.minAmount + Math.floor(currentSettings.minAmount / 2);
  const doubleMin = currentSettings.minAmount * 2;

  const testNum = Number(testAmount) || 0;
  const testPointsEarned = calculateRewards(testNum, currentSettings);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-serif text-2xl">System Settings</h2>
          <p className="text-xs text-black/60 mt-1">
            Dynamic reward points calculation engine. Changes take effect across all customer forms and calculations.
          </p>
        </div>
      </div>

      <Card className="bg-white border-[#F2F2F2] shadow-sm rounded-3xl p-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-xl text-black">Reward Points Configuration</CardTitle>
            {isLoadingSettings && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading synced settings...
              </span>
            )}
          </div>
          <p className="text-xs text-black opacity-60">
            Configure the base conversion rate for reward points.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Purchase Amount Target */}
            <div className="space-y-2">
              <Label className="text-black font-bold">Spend Amount (₹)</Label>
              <Input
                type="number"
                min="1"
                value={settings.minAmount === '' ? '' : settings.minAmount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minAmount: e.target.value === '' ? ('' as any) : Number(e.target.value),
                  })
                }
                className="bg-white text-black border-[#F2F2F2] rounded-xl"
                placeholder="1000"
              />
              <p className="text-[11px] text-black opacity-60">
                The benchmark amount spent for earning points.
              </p>
            </div>

            {/* Points Earned */}
            <div className="space-y-2">
              <Label className="text-black font-bold">Points Earned</Label>
              <Input
                type="number"
                min="0"
                value={settings.basePoints === '' ? '' : (settings.basePoints ?? settings.pointsPerIncrement ?? '')}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    basePoints: e.target.value === '' ? ('' as any) : Number(e.target.value),
                  })
                }
                className="bg-white text-black border-[#F2F2F2] rounded-xl"
                placeholder="50"
              />
              <p className="text-[11px] text-black opacity-60">
                The number of points awarded for the spend amount.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[#F2F2F2]">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-black hover:bg-black/80 text-white rounded-full py-6 uppercase text-[11px] font-bold tracking-wider"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
            <Button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="flex-1 bg-[#B08D57] hover:bg-[#967648] text-white rounded-full py-6 uppercase text-[11px] font-bold tracking-wider"
            >
              {isRecalculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Existing Customers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DYNAMIC EXAMPLE CALCULATION & INTERACTIVE TESTER */}
      <div className="p-6 bg-[#FDFCFB] rounded-3xl border border-[#F2F2F2] space-y-6">
        <div>
          <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#B08D57]" /> Example Calculation
          </h3>
          <p className="text-xs text-black/70 mb-3">
            Points are calculated proportionally based on your configuration above:
          </p>

          <ul className="text-xs text-black space-y-2 list-disc pl-5 opacity-90">
            <li>
              A purchase of <strong>₹{belowMin.toLocaleString()}</strong> earns{' '}
              <strong className="text-[#B08D57]">{calculateRewards(belowMin, currentSettings)} points</strong>.
            </li>
            <li>
              A purchase of <strong>₹{atMin.toLocaleString()}</strong> (meets benchmark threshold) earns{' '}
              <strong className="text-[#B08D57]">{calculateRewards(atMin, currentSettings)} points</strong>.
            </li>
            <li>
              A purchase of <strong>₹{proportional.toLocaleString()}</strong> earns{' '}
              <strong className="text-[#B08D57]">{calculateRewards(proportional, currentSettings)} points</strong>.
            </li>
            <li>
              A purchase of <strong>₹{doubleMin.toLocaleString()}</strong> (double the benchmark threshold) earns{' '}
              <strong className="text-[#B08D57]">{calculateRewards(doubleMin, currentSettings)} points</strong>.
            </li>
          </ul>
        </div>

        {/* Live Interactive Tester */}
        <div className="bg-white p-4 rounded-2xl border border-[#F0EBE1] shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4 text-[#B08D57]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-black">Live Points Calculator Tester</h4>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-60">
              <Label className="text-[11px] text-black/70 mb-1 block">Test Any Purchase Amount (₹)</Label>
              <Input
                type="number"
                min="0"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="bg-[#FAFAFA] border-[#E8E8E8] text-black font-semibold rounded-xl"
                placeholder="1000"
              />
            </div>

            <div className="w-full sm:flex-1 bg-[#F9F6F0] border border-[#E9DFCF] p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-black/60 uppercase tracking-wider font-semibold">Calculated Points</p>
                <p className="text-xl font-bold font-serif text-[#967648]">
                  {testPointsEarned} <span className="text-xs font-sans font-normal text-black/70">Points</span>
                </p>
              </div>

              <div className="text-right text-[11px] text-black/60">
                <span>
                  {testNum} * ({currentSettings.basePoints} / {currentSettings.minAmount}) = {testPointsEarned}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
