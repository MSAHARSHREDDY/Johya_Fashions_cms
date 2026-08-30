import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  Download,
  X,
  Award,
  Loader2,
  Users,
  ShoppingBag,
  PlusCircle
} from 'lucide-react';
import { formatIST } from '@/lib/date-utils';
import { toast } from 'sonner';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { customerApi } from '@/services/customerApi';
import { Checkbox } from '@/components/ui/checkbox';
import { Customer, Category } from '@/types/customer';
import CustomerForm from '@/components/CustomerForm';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateRewards } from '@/lib/settings';
import { useEffect } from 'react';

interface CustomersProps {
  onView?: (id: string) => void;
  
  globalSearch?: string;
}

export default function Customers({ onView, globalSearch = '' }: CustomersProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  // const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    categories: [] as Category[],
    minPrice: '',
    maxPrice: '',
    fromDate: '',
    toDate: '',
  });

  // Modals state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Queries
  const { data: response, isLoading } = useQuery({
    queryKey: ['customers', page, limit, globalSearch, sortBy, sortOrder, filters],
    queryFn: () => customerApi.getCustomers({
      page,
      limit,
      search: globalSearch,
      sortBy,
      sortOrder,
      category: filters.categories.join(','),
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    }),
    placeholderData: keepPreviousData,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => customerApi.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Customer updated successfully');
      setEditingCustomer(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update customer'),
  });
  
  // Quick Log State
  const [quickLogCustomer, setQuickLogCustomer] = useState<Customer | null>(null);
  const [adjustPointsCustomer, setAdjustPointsCustomer] = useState<Customer | null>(null);
  const [adjustPointsValue, setAdjustPointsValue] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseRewards, setPurchaseRewards] = useState(0);
  const [purchaseCategories, setPurchaseCategories] = useState<Category[]>([]);

  useEffect(() => {
    const val = Number(purchaseAmount);
    if (!isNaN(val) && quickLogCustomer) {
      const currentTotalRewards = calculateRewards(quickLogCustomer.price);
      const newTotalRewards = calculateRewards(quickLogCustomer.price + val);
      setPurchaseRewards(Math.max(0, newTotalRewards - currentTotalRewards));
    } else {
      setPurchaseRewards(0);
    }
  }, [purchaseAmount, quickLogCustomer]);

  const addPurchaseMutation = useMutation({
    mutationFn: (data: any) => customerApi.addPurchase(quickLogCustomer?._id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Purchase logged successfully');
      setQuickLogCustomer(null);
      setPurchaseAmount('');
      setPurchaseRewards(0);
      setPurchaseCategories([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to log purchase')
  });

  const deleteMutation = useMutation({
    mutationFn: customerApi.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Customer deleted successfully');
      setDeletingId(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete customer'),
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const customers = response?.data || [];
  const pagination = response?.pagination;

  const categoryOptions: Category[] = ['Women', 'Men', 'Boys', 'Girls'];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <Card className="flex-grow bg-white rounded-3xl shadow-lg border border-[#F2F2F2] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[#F2F2F2] flex justify-between items-center bg-white">
          <h2 className="font-serif text-xl">Customer Directory</h2>
          <div className="flex gap-2">
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-[120px] bg-white border-none text-[11px] uppercase tracking-wider font-bold h-9">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 Per Page</SelectItem>
                <SelectItem value="25">25 Per Page</SelectItem>
                <SelectItem value="50">50 Per Page</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger render={<Button variant="ghost" className="bg-white text-[11px] uppercase tracking-wider font-bold h-9 gap-2" />}>
                <Filter className="h-3 w-3" /> Filters
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-2xl shadow-xl border-[#F2F2F2] p-6">
                <div className="space-y-4">
                  <h4 className="font-serif text-lg">Filter Directory</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-black font-bold">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {categoryOptions.map(cat => (
                        <Badge 
                          key={cat}
                          variant={filters.categories.includes(cat) ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer uppercase text-[10px] tracking-wider px-3",
                            filters.categories.includes(cat) ? "bg-[#B08D57] border-[#B08D57]" : "border-[#F2F2F2]"
                          )}
                          onClick={() => {
                            const newCats = filters.categories.includes(cat)
                              ? filters.categories.filter(c => c !== cat)
                              : [...filters.categories, cat];
                            setFilters({...filters, categories: newCats});
                          }}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-black font-bold">Min Value</label>
                      <Input 
                        type="number" 
                        value={filters.minPrice} 
                        onChange={e => setFilters({...filters, minPrice: e.target.value})}
                        placeholder="₹0"
                        className="h-8 text-xs font-semibold text-black border-[#F2F2F2]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-black font-bold">Max Value</label>
                      <Input 
                        type="number" 
                        value={filters.maxPrice} 
                        onChange={e => setFilters({...filters, maxPrice: e.target.value})}
                        placeholder="₹∞"
                        className="h-8 text-xs font-semibold text-black border-[#F2F2F2]"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="link" 
                    className="w-full text-[10px] uppercase tracking-widest font-bold h-auto p-0 pt-2 text-[#B08D57]" 
                    onClick={() => setFilters({categories: [], minPrice: '', maxPrice: '', fromDate: '', toDate: ''})}
                  >
                    Reset All Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex-grow overflow-auto">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-white border-y border-[#F2F2F2]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 py-4 w-16 text-[10px] uppercase tracking-widest text-black font-bold">S.No</TableHead>
                  <TableHead className="px-6 py-4 cursor-pointer text-[10px] uppercase tracking-widest text-black font-bold" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Customer Name <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-widest text-black font-bold">Phone</TableHead>
                  <TableHead className="px-6 py-4 cursor-pointer text-[10px] uppercase tracking-widest text-black font-bold" onClick={() => handleSort('lastPurchaseDate')}>
                    <div className="flex items-center gap-1">Purchase Date <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="px-6 py-4 text-[10px] uppercase tracking-widest text-black font-bold">Categories</TableHead>
                  <TableHead className="px-6 py-4 cursor-pointer text-[10px] uppercase tracking-widest text-black font-bold" onClick={() => handleSort('price')}>
                    <div className="flex items-center gap-1">Value <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="px-6 py-4 cursor-pointer text-[10px] uppercase tracking-widest text-black font-bold" onClick={() => handleSort('rewards')}>
                    <div className="flex items-center gap-1">Offer / Points <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                                    <TableHead className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-black font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#F2F2F2]">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((_, j) => (
                        <TableCell key={j} className="px-6 py-4"><Skeleton className="h-6 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <Users className="w-8 h-8" />
                        <p className="font-serif italic">No customers match your criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer, i) => (
                    <TableRow key={customer._id} className="hover:bg-[#FDFCFB] group transition-colors">
                      <TableCell className="px-6 py-4 text-sm font-semibold text-black opacity-50">{String((page - 1) * limit + i + 1).padStart(2, '0')}</TableCell>
                      <TableCell className="px-6 py-4 font-semibold text-sm font-semibold text-black">{customer.name}</TableCell>
                      <TableCell className="px-6 py-4 font-mono text-xs font-semibold text-black opacity-70">{customer.phoneNumber}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm font-semibold text-black opacity-70 italic">{formatIST(customer.lastPurchaseDate, 'dd MMM yyyy')}</div>
                        <div className="text-[10px] text-black font-bold">{formatIST(customer.lastPurchaseDate, 'p')}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {customer.categories.map(cat => (
                            <Badge 
                              key={cat} 
                              variant="secondary" 
                              className={cn(
                                "text-[9px] py-0 px-2 font-bold uppercase tracking-wider",
                                cat === 'Women' ? "bg-[#F1EDE7] text-[#B08D57]" : "bg-[#F2F2F2] text-black"
                              )}
                            >
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 font-medium text-sm font-semibold text-black">₹{customer.price.toLocaleString()}</TableCell>
                      <TableCell className="px-6 py-4 font-bold text-[#B08D57] text-sm font-semibold text-black">{customer.rewards}</TableCell>
                      <TableCell className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setQuickLogCustomer(customer)}
                          className="h-8 text-[10px] uppercase font-bold tracking-widest gap-1 hover:bg-[#B08D57] hover:text-white transition-all rounded-full px-3 border border-transparent hover:border-[#B08D57]"
                        >
                          <PlusCircle className="h-3 w-3" /> Log Purchase
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0 opacity-40 group-hover:opacity-100" />}>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-[#F2F2F2] shadow-xl">
                            <DropdownMenuItem onClick={() => onView ? onView(customer._id) : setViewingCustomer(customer)} className="text-[11px] uppercase tracking-widest font-bold">
                              <Eye className="mr-2 h-3 w-3" /> View Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingCustomer(customer)} className="text-[11px] uppercase tracking-widest font-bold">
                              <Edit className="mr-2 h-3 w-3" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingId(customer._id)} className="text-[11px] uppercase tracking-widest font-bold text-destructive">
                              <Trash2 className="mr-2 h-3 w-3" /> Remove Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))
            ) : customers.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-black font-bold italic font-serif">
                No records found.
              </div>
            ) : (
              customers.map((customer, i) => (
                <Card key={customer._id} className="overflow-hidden border-[#F2F2F2] rounded-2xl shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base">{customer.name}</h3>
                        <p className="text-xs font-semibold text-black font-mono opacity-60 tracking-tight">{customer.phoneNumber}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-[#D1D1D1] text-black font-bold">#{ String((page - 1) * limit + i + 1).padStart(2, '0') }</Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {customer.categories.map(cat => (
                        <Badge key={cat} variant="secondary" className="text-[9px] uppercase font-bold tracking-wider">{cat}</Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-black py-3 border-y border-[#F2F2F2]">
                      <div>
                        <p className="text-black font-bold text-[10px] uppercase tracking-widest font-bold mb-1">Purchase Date</p>
                        <p className="font-medium italic">{formatIST(customer.lastPurchaseDate, 'dd MMM yyyy')}</p>
                        <p className="text-[9px] text-black font-bold opacity-60">{formatIST(customer.lastPurchaseDate, 'p')} (IST)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-black font-bold text-[10px] uppercase tracking-widest font-bold mb-1">Value</p>
                        <p className="font-serif text-base">₹{customer.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-[#B08D57]" />
                        <span className="text-[#B08D57] font-bold">{customer.rewards} pts</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onView ? onView(customer._id) : setViewingCustomer(customer)} className="h-8 rounded-full text-[10px] uppercase font-bold tracking-widest px-4 border-[#F2F2F2]">
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingId(customer._id)} className="h-8 w-8 text-destructive p-0 rounded-full">
                          <Trash2 className="h-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-white border-t border-[#F2F2F2] flex flex-col sm:flex-row gap-4 justify-between items-center text-[11px] text-black font-bold uppercase tracking-wider font-semibold">
          {pagination ? (
            <div>Showing {String((page - 1) * limit + 1).padStart(2, '0')} - {String(Math.min(page * limit, pagination.total)).padStart(2, '0')} of {pagination.total.toLocaleString()} records</div>
          ) : <div>Loading records...</div>}
          
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              className="w-8 h-8 p-0 rounded border border-[#D1D1D1] bg-white shadow-sm" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 h-4" />
            </Button>
            
            {pagination && [...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
              const p = i + 1;
              return (
                <Button 
                  key={p} 
                  variant={p === page ? "default" : "outline"} 
                  className={cn(
                    "w-8 h-8 p-0 rounded border shadow-sm",
                    p === page ? "bg-[#B08D57] border-[#B08D57] text-white" : "bg-white border-[#D1D1D1]"
                  )}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              );
            })}
            
            <Button 
              variant="outline" 
              className="w-8 h-8 p-0 rounded border border-[#D1D1D1] bg-white shadow-sm" 
              disabled={!pagination || page === pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modals - Keeping simple as they use existing UI components */}
      

      {/* Edit Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl border-b border-[#F2F2F2] pb-4">Edit Customer Profile</DialogTitle>
            <DialogDescription className="text-xs font-semibold text-black pt-2">
              Modify the existing record for {editingCustomer?.name}.
            </DialogDescription>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm 
              customer={editingCustomer}
              onSubmit={(data) => updateMutation.mutate({ id: editingCustomer._id, data })} 
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Confirm Removal</DialogTitle>
            <DialogDescription className="text-xs font-semibold text-black italic">
              Are you sure you want to permanently remove this customer record? This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeletingId(null)} className="rounded-full px-6 text-[11px] uppercase font-bold tracking-wider">Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              disabled={deleteMutation.isPending}
              className="rounded-full px-6 text-[11px] uppercase font-bold tracking-wider"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!adjustPointsCustomer} onOpenChange={(open) => !open && setAdjustPointsCustomer(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-8 border-none shadow-2xl bg-white text-black">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl border-b border-[#F2F2F2] pb-4">Adjust Points</DialogTitle>
            <DialogDescription className="text-xs font-semibold text-black pt-2">
              Update the reward points for {adjustPointsCustomer?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Points Value</Label>
              <Input 
                type="number" 
                value={adjustPointsValue} 
                onChange={(e) => setAdjustPointsValue(e.target.value)}
                placeholder="Enter points"
                className="bg-white border-[#F2F2F2] text-black"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdjustPointsCustomer(null)} className="rounded-full px-6 text-[11px] uppercase font-bold tracking-wider">Cancel</Button>
            <Button 
              onClick={() => {
                if (adjustPointsCustomer && adjustPointsValue) {
                  updateMutation.mutate({ id: adjustPointsCustomer._id, data: { rewards: Number(adjustPointsValue) } });
                  setAdjustPointsCustomer(null);
                  setAdjustPointsValue('');
                }
              }}
              className="bg-[#B08D57] hover:bg-[#967648] text-white rounded-full px-6 text-[11px] uppercase font-bold tracking-wider"
            >
              Save Points
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Log Purchase Dialog */}
      <Dialog open={!!quickLogCustomer} onOpenChange={(open) => !open && setQuickLogCustomer(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl border-b border-[#F2F2F2] pb-4">Quick Log Purchase</DialogTitle>
            <DialogDescription className="text-xs font-semibold text-black pt-2">
              Record a new purchase for {quickLogCustomer?.name} to update their history and rewards.
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
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Rewards Earned (Auto-calculated)</Label>
              <Input 
                type="number" 
                value={purchaseRewards} 
                onChange={(e) => setPurchaseRewards(Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="grid grid-cols-2 gap-2">
                {categoryOptions.map((category) => (
                  <div 
                    key={category} 
                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-2"
                  >
                    <Checkbox
                      id={`quick-purchase-category-${category}`}
                      checked={purchaseCategories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPurchaseCategories([...purchaseCategories, category]);
                        } else {
                          setPurchaseCategories(purchaseCategories.filter((c) => c !== category));
                        }
                      }}
                    />
                    <Label htmlFor={`quick-purchase-category-${category}`} className="text-sm font-normal cursor-pointer leading-none flex-1">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <Button 
              className="w-full bg-black text-white hover:bg-black rounded-full py-6 mt-4" 
              onClick={() => addPurchaseMutation.mutate({ amount: Number(purchaseAmount), rewardsEarned: purchaseRewards, categories: purchaseCategories })}
              disabled={addPurchaseMutation.isPending || !purchaseAmount || purchaseCategories.length === 0}
            >
              {addPurchaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Save Purchase
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

