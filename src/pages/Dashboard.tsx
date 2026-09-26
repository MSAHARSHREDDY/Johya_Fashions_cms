import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  UserRound, 
  UserRoundCheck,
  Smile,
  ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Wallet, Gift } from 'lucide-react';
import { customerApi } from '@/services/customerApi';
import { formatIST } from '@/lib/date-utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, subDays, subMonths, isAfter } from 'date-fns';

export default function Dashboard() {
  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => customerApi.getStats(),
  });

  const [timeframe, setTimeframe] = useState<'today' | 'weekly' | 'monthly' | 'yearly'>('today');

  const stats = statsResponse?.data;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const getChartData = () => {
    const now = new Date();
    const dataMap = new Map<string, number>();

    // Initialize map with empty points to ensure full axis
    if (timeframe === 'today') {
      const hourSlots = [
        { label: '8 AM', h: 8 },
        { label: '10 AM', h: 10 },
        { label: '12 PM', h: 12 },
        { label: '2 PM', h: 14 },
        { label: '4 PM', h: 16 },
        { label: '6 PM', h: 18 },
        { label: '8 PM', h: 20 },
        { label: '10 PM', h: 22 },
      ];
      hourSlots.forEach(slot => dataMap.set(slot.label, 0));

      if (stats?.todayHourlyData && stats.todayHourlyData.length > 0) {
        stats.todayHourlyData.forEach((item: { hour: number; revenue: number }) => {
          let bestSlot = '12 PM';
          let minDiff = Infinity;
          for (const slot of hourSlots) {
            const diff = Math.abs(slot.h - item.hour);
            if (diff < minDiff) {
              minDiff = diff;
              bestSlot = slot.label;
            }
          }
          dataMap.set(bestSlot, (dataMap.get(bestSlot) || 0) + item.revenue);
        });
      } else {
        // Fallback to today's date in revenueData if available
        const todayKey = formatIST(now, 'yyyy-MM-dd');
        const todayMatch = stats?.revenueData?.find((d: any) => d.date === todayKey);
        if (todayMatch && todayMatch.revenue > 0) {
          dataMap.set('12 PM', todayMatch.revenue);
        }
      }
      return Array.from(dataMap, ([name, revenue]) => ({ name, revenue }));
    }

    if (!stats?.revenueData) return [];

    if (timeframe === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        dataMap.set(formatIST(subDays(now, i), 'EEE'), 0);
      }
    } else if (timeframe === 'monthly') {
      for (let i = 30; i >= 0; i--) {
        // use short date format for month
        dataMap.set(formatIST(subDays(now, i), 'MMM dd'), 0);
      }
    } else if (timeframe === 'yearly') {
      for (let i = 11; i >= 0; i--) {
        dataMap.set(formatIST(subMonths(now, i), 'MMM'), 0);
      }
    }

    stats.revenueData.forEach((item: any) => {
      const d = parseISO(item.date);
      let key = '';
      
      if (timeframe === 'weekly') {
        key = formatIST(d, 'EEE');
      } else if (timeframe === 'monthly') {
        key = formatIST(d, 'MMM dd');
      } else if (timeframe === 'yearly') {
        key = formatIST(d, 'MMM');
      }
      
      if (dataMap.has(key)) {
        dataMap.set(key, (dataMap.get(key) || 0) + item.revenue);
      }
    });

    return Array.from(dataMap, ([name, revenue]) => ({ name, revenue }));
  };

  const chartData = getChartData();

  const cards = [
    {
      title: 'Total Customers',
      icon: <Users className="w-4 h-4" />,
      value: (stats?.totalCustomers || 0).toLocaleString(),
      footer: `${(stats?.customerGrowth || 0) >= 0 ? '+' : ''}${(stats?.customerGrowth || 0).toFixed(1)}% from last month`,
      footerColor: (stats?.customerGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Total Value',
      icon: <Wallet className="w-4 h-4" />,
      value: `₹${(stats?.totalPurchaseValue || 0).toLocaleString()}`,
      footer: `Avg ₹${Math.round((stats?.totalPurchaseValue || 0) / (stats?.totalCustomers || 1)).toLocaleString()} / customer`,
    },
    {
      title: 'Issued Rewards',
      icon: <Gift className="w-4 h-4" />,
      value: (stats?.totalRewards || 0).toLocaleString(),
      footer: `${Math.round(stats?.rewardsRedeemedPercentage || 0)}% Redeemed`,
      footerColor: 'text-[#B08D57]',
    },
  ];

  return (
    <div className="space-y-12">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        {cards.map((card, i) => (
          <Card key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-[#F2F2F2]">
            <div className="flex items-center gap-2 text-black font-bold mb-2">{card.icon}<p className="text-[10px] uppercase tracking-wider font-semibold">{card.title}</p></div>
            <p className="text-3xl font-serif">{card.value}</p>
            {card.footer && (
              <div className={`mt-2 text-[10px] font-medium ${card.footerColor || 'text-black font-bold'}`}>
                {card.footer}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-[#F2F2F2]">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 border-b border-[#F2F2F2] pb-4">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl">Revenue Trends</h2>
            {timeframe === 'today' && (
              <span className="text-xs bg-[#FDFBF7] text-[#B08D57] font-semibold px-3 py-1 rounded-full border border-[#E9DFCF]">
                Today: ₹{(stats?.todayRevenue || 0).toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex bg-[#F2F2F2] rounded-full p-1 self-start sm:self-auto">
            {(['today', 'weekly', 'monthly', 'yearly'] as const).map(t => (
              <button 
                key={t}
                id={`revenue-trend-timeframe-${t}`}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors capitalize ${timeframe === t ? 'bg-white shadow-sm text-black' : 'text-black/60 hover:text-black font-bold'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#777' }} dy={10} minTickGap={20} padding={{ left: 20, right: 20 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#777' }} dx={-10} tickFormatter={(val) => `₹${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                itemStyle={{ color: '#B08D57', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#B08D57" 
                strokeWidth={3} 
                dot={{ fill: '#B08D57', strokeWidth: 2, r: 4, stroke: '#fff' }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="space-y-6">
        <h2 className="font-serif text-2xl border-b border-[#F2F2F2] pb-4">Category Insights</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { label: 'Women', icon: UserRoundCheck, count: stats?.categories?.['Women'] || 0, color: 'bg-primary' },
            { label: 'Men', icon: UserRound, count: stats?.categories?.['Men'] || 0, color: 'bg-foreground' },
            { label: 'Boys', icon: Smile, count: stats?.categories?.['Boys'] || 0, color: 'bg-border' },
            { label: 'Girls', icon: Smile, count: stats?.categories?.['Girls'] || 0, color: 'bg-pink-100 text-pink-600' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-[#F2F2F2] flex items-center justify-between group hover:border-primary transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-black font-bold">{item.label}</p>
                  <p className="text-xl font-serif">{item.count}</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
