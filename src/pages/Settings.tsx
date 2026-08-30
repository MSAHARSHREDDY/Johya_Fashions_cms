import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getPointSettings, savePointSettings, PointSettings } from '@/lib/settings';
import { toast } from 'sonner';
import { useState as useState2 } from 'react';
import { Loader2 } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<any>({
    minAmount: 1000,
    incrementAmount: 500,
    pointsPerIncrement: 50
  });

  useEffect(() => {
    setSettings(getPointSettings());
  }, []);


  const [isRecalculating, setIsRecalculating] = useState2(false);

  const handleSave = async () => {
    savePointSettings({
      minAmount: Number(settings.minAmount) || 0,
      incrementAmount: Number(settings.incrementAmount) || 1, // prevent divide by zero
      pointsPerIncrement: Number(settings.pointsPerIncrement) || 0
    });
    toast.success('Point settings saved locally.');
  };
  
  const handleRecalculate = async () => {
    // confirm() removed due to iframe restrictions
    
    setIsRecalculating(true);
    try {
      const res = await fetch('/api/customers/recalculate-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minAmount: Number(settings.minAmount) || 0,
          incrementAmount: Number(settings.incrementAmount) || 1,
          pointsPerIncrement: Number(settings.pointsPerIncrement) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('All customer points recalculated successfully!');
      } else {
        toast.error('Failed to recalculate: ' + data.message);
      }
    } catch (e) {
      toast.error('Network error while recalculating points');
    } finally {
      setIsRecalculating(false);
    }
  };
  

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl mb-8">System Settings</h2>
      
      <Card className="bg-white border-[#F2F2F2] shadow-sm rounded-3xl p-4">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-black">Reward Points Configuration</CardTitle>
          <p className="text-xs text-black opacity-60">Adjust how points are awarded to customers based on purchase amounts.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-2">
            <Label className="text-black font-bold">Minimum Amount for Points (₹)</Label>
            <Input 
              type="number" 
              value={settings.minAmount === '' ? '' : settings.minAmount}
              onChange={(e) => setSettings({ ...settings, minAmount: e.target.value === '' ? '' : Number(e.target.value) })}
              className="bg-white text-black border-[#F2F2F2]"
            />
            <p className="text-[10px] text-black opacity-60">The minimum purchase value to start earning points.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-black font-bold">Points Awarded (Base & Increments)</Label>
            <Input 
              type="number" 
              value={settings.pointsPerIncrement === '' ? '' : settings.pointsPerIncrement}
              onChange={(e) => setSettings({ ...settings, pointsPerIncrement: e.target.value === '' ? '' : Number(e.target.value) })}
              className="bg-white text-black border-[#F2F2F2]"
            />
            <p className="text-[10px] text-black opacity-60">Number of points awarded at the minimum amount, and for each subsequent increment.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-black font-bold">Increment Step (₹)</Label>
            <Input 
              type="number" 
              value={settings.incrementAmount === '' ? '' : settings.incrementAmount}
              onChange={(e) => setSettings({ ...settings, incrementAmount: e.target.value === '' ? '' : Number(e.target.value) })}
              className="bg-white text-black border-[#F2F2F2]"
            />
            <p className="text-[10px] text-black opacity-60">For every additional amount of this value above the minimum, award the points above again.</p>
          </div>

          
          <div className="flex gap-4 mt-4">
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-black hover:bg-black/80 text-white rounded-full py-6 uppercase text-[11px] font-bold tracking-wider"
            >
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
      
      <div className="p-6 bg-[#FDFCFB] rounded-3xl border border-[#F2F2F2]">
        <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-2">Example Calculation</h3>
        <p className="text-xs text-black mb-1">
          With current settings:
        </p>
        <ul className="text-xs text-black space-y-1 list-disc pl-5 opacity-80">
          <li>A purchase of ₹{settings.minAmount - 100} earns 0 points.</li>
          <li>A purchase of ₹{settings.minAmount} earns {settings.pointsPerIncrement} points.</li>
          <li>A purchase of ₹{settings.minAmount + settings.incrementAmount} earns {settings.pointsPerIncrement * 2} points.</li>
        </ul>
      </div>

    </div>
  );
}
