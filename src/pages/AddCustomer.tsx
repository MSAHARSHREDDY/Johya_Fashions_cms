import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomerForm from '@/components/CustomerForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/services/customerApi';
import { toast } from 'sonner';
import { CustomerFormData } from '@/types/customer';

export default function AddCustomer({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: customerApi.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Customer created successfully');
      onBack();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to create customer'),
  });

  const handleSubmit = (data: CustomerFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <Button variant="ghost" onClick={onBack} className="text-black hover:text-foreground -ml-4 mb-2">
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Directory
      </Button>
      
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#E5E5E5]">
        <h2 className="text-2xl font-serif mb-6 border-b border-[#E5E5E5] pb-4">Create New Customer</h2>
        <CustomerForm 
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
        />
      </div>
    </div>
  );
}
