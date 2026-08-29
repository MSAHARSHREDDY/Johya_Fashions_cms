import { useQuery } from '@tanstack/react-query';
import { formatIST } from '@/lib/date-utils';
import { 
  ArrowLeft, 
  Award, 
  Calendar, 
  Phone, 
  User, 
  ShoppingBag,
  History,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { customerApi } from '@/services/customerApi';
import { cn } from '@/lib/utils';

interface CustomerDetailsProps {
  customerId: string;
  onBack: () => void;
  onEdit: () => void;
}

export default function CustomerDetails({ customerId, onBack, onEdit }: CustomerDetailsProps) {
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseRewards, setPurchaseRewards] = useState(0);

  useEffect(() => {
    const val = Number(purchaseAmount);
    if (!isNaN(val) && val >= 1000) {
      setPurchaseRewards(Math.max(0, Math.floor(val / 500) - 1) * 50);
    } else {
      setPurchaseRewards(0);
    }
  }, [purchaseAmount]);

  const queryClient = useQueryClient();
  const addPurchaseMutation = useMutation({
    mutationFn: (data: any) => customerApi.addPurchase(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Purchase logged successfully');
      setIsPurchaseOpen(false);
      setPurchaseAmount('');
      setPurchaseRewards(0);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to log purchase')
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerApi.getCustomer(customerId),
    enabled: !!customerId,
  });

  const customer = response?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32 rounded-full" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96 md:col-span-2 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="font-serif italic text-black font-bold">Customer profile not found.</p>
        <Button onClick={onBack} variant="outline" className="rounded-full uppercase tracking-widest text-[10px] font-bold">Return to Directory</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-[11px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100">
          <ArrowLeft className="h-3 w-3" /> Back to Directory
        </Button>
        <Button onClick={onEdit} variant="outline" className="rounded-full px-8 text-[11px] uppercase tracking-widest font-bold border-[#F2F2F2] hover:bg-white">Edit Profile</Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-2 bg-white rounded-3xl shadow-lg border border-[#F2F2F2] overflow-hidden">
          <CardHeader className="bg-white border-b border-[#F2F2F2] p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center text-[#B08D57] text-3xl font-serif">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#B08D57] font-bold mb-1">Customer Profile</p>
                  <CardTitle className="text-3xl font-serif text-black">{customer.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2 font-mono text-sm opacity-70">
                    <Phone className="h-3 w-3" /> {customer.phoneNumber}
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-[#B08D57] text-white px-4 py-1 rounded-full uppercase text-[10px] font-bold tracking-widest border-none">Verified</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-12 sm:grid-cols-2">
              <div className="space-y-8">
                <div>
                  <h3 className="text-[11px] text-black font-bold uppercase tracking-[0.2em] mb-4">Classifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {customer.categories.map(cat => (
                      <Badge 
                        key={cat} 
                        variant="outline" 
                        className={cn(
                          "px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-full",
                          cat === 'Women' ? "border-[#B08D57] text-[#B08D57]" : "border-[#F2F2F2] text-foreground"
                        )}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-[11px] text-black font-bold uppercase tracking-[0.2em] mb-4">Registry Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm opacity-80">
                      <User className="h-4 w-4 opacity-40" />
                      <span className="font-medium">Identified as {customer.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm opacity-80">
                      <Phone className="h-4 w-4 opacity-40" />
                      <span className="font-mono">Contact via {customer.phoneNumber}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-[11px] text-black font-bold uppercase tracking-[0.2em] mb-4">Acquisition Metrics</h3>
                  <div className="bg-white rounded-2xl p-6 border border-[#F2F2F2] space-y-5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-black font-bold">
                        <Calendar className="h-3 w-3" /> Last Engagement
                      </div>
                      <span className="font-serif italic text-sm">{formatIST(customer.lastPurchaseDate, 'dd MMM yyyy')}</span>
                    </div>
                    <div className="flex justify-end text-[9px] text-black font-bold -mt-4 mb-2">
                      {formatIST(customer.lastPurchaseDate, 'p')} (IST)
                    </div>
                    <Separator className="bg-[#E5E5E5]" />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-black font-bold">
                        <ShoppingBag className="h-3 w-3" /> Settlement Value
                      </div>
                      <span className="text-2xl font-serif text-[#1A1A1A]">₹{customer.price.toLocaleString()}</span>
                    </div>
                    <Separator className="bg-[#E5E5E5]" />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-black font-bold">
                        <ArrowUpRight className="h-3 w-3" /> Total Visits
                      </div>
                      <span className="text-lg font-serif text-[#1A1A1A]">{customer.visits || 1}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-4 bg-muted/30 rounded-xl flex flex-col gap-2 border border-[#F2F2F2]">
                    <div className="flex items-center gap-1 text-[9px] text-black font-bold uppercase tracking-widest font-bold">
                      <History className="h-2.5 w-2.5" /> Established
                    </div>
                    <p className="text-[11px] font-medium opacity-80">{formatIST(customer.createdAt, 'dd MMM yyyy')}</p>
                    <p className="text-[9px] text-black font-bold opacity-60">{formatIST(customer.createdAt, 'p')} (IST)</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl flex flex-col gap-2 border border-[#F2F2F2]">
                    <div className="flex items-center gap-1 text-[9px] text-black font-bold uppercase tracking-widest font-bold">
                      <Clock className="h-2.5 w-2.5" /> Last Modified
                    </div>
                    <p className="text-[11px] font-medium opacity-80">{formatIST(customer.updatedAt, 'dd MMM yyyy')}</p>
                    <p className="text-[9px] text-black font-bold opacity-60">{formatIST(customer.updatedAt, 'p')} (IST)</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black text-white rounded-3xl shadow-xl border-none flex flex-col">
          <CardHeader className="p-8 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B08D57] flex items-center justify-center mb-6 shadow-lg shadow-[#B08D57]/20">
              <Award className="h-6 w-6 text-black" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#B08D57] font-bold">Reward Balance</p>
            <CardTitle className="text-2xl font-serif text-black mt-1">Loyalty Account</CardTitle>
            <CardDescription className="text-black/40 text-xs">Points accumulated from acquisitions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 px-8 flex-grow">
            <div className="text-8xl font-serif text-white tracking-tighter">{customer.rewards}</div>
            <p className="text-[#B08D57] font-bold tracking-[0.4em] uppercase text-[10px] mt-4">Total Points</p>
          </CardContent>
          <div className="p-8 pt-0">
            <Button onClick={() => setIsPurchaseOpen(true)} className="w-full bg-[#B08D57] text-white hover:bg-[#967648] rounded-full py-6 uppercase text-[10px] font-bold tracking-widest shadow-md border-none">
              Log Visit / Purchase
            </Button>
          </div>
        </Card>
      </div>

      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl border-b border-[#F2F2F2] pb-4">Log Purchase</DialogTitle>
            <DialogDescription className="text-xs pt-2">
              Record a new purchase for {customer.name} to update their history and calculate rewards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Purchase Amount (₹)</Label>
              <Input 
                type="number" 
                value={purchaseAmount} 
                onChange={(e) => setPurchaseAmount(e.target.value)} 
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Rewards Earned</Label>
              <Input 
                type="number" 
                value={purchaseRewards} 
                onChange={(e) => setPurchaseRewards(Number(e.target.value))} 
              />
            </div>
            <Button 
              className="w-full bg-black text-white hover:bg-black rounded-full" 
              onClick={() => addPurchaseMutation.mutate({ amount: Number(purchaseAmount), rewardsEarned: purchaseRewards, categories: [] })}
              disabled={addPurchaseMutation.isPending}
            >
              Confirm Purchase
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
