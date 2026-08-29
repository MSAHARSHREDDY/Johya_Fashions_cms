// @ts-nocheck
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatIST } from '@/lib/date-utils';
import { calculateRewards } from '@/lib/settings';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Category, Customer, CustomerFormData } from '@/types/customer';

const categories: Category[] = ['Women', 'Men', 'Boys', 'Girls'];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  lastPurchaseDate: z.date({
    invalid_type_error: "Last purchase date is required",
    required_error: "Last purchase date is required",
  }),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  price: z.coerce.number().min(0, 'Price must be numeric'),
  rewards: z.coerce.number().min(0, 'Rewards must be numeric'),
});

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerFormData) => void;
  isLoading?: boolean;
}

export default function CustomerForm({ customer, onSubmit, isLoading }: CustomerFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({

    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      lastPurchaseDate: new Date(),
      categories: [],
      price: '' as any,
      rewards: '' as any,
    },
  });

  const priceValue = form.watch('price');

  useEffect(() => {
    // Dynamic rewards calculation
    if (!customer) {
      form.setValue('rewards', calculateRewards(priceValue));
    }
  }, [priceValue, customer, form]);

  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        lastPurchaseDate: new Date(customer.lastPurchaseDate),
        categories: customer.categories,
        price: customer.price,
        rewards: customer.rewards,
      });
    }
  }, [customer, form]);

  const onFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values as unknown as CustomerFormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
        <FormField
          control={form.control as any}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black font-bold">Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control as any}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black font-bold">Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+91 XXXXX XXXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control as any}
          name="lastPurchaseDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-black font-bold">Last Purchase Date</FormLabel>
              <Popover>
                <FormControl>
                  <PopoverTrigger
                    render={
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-black"
                        )}
                      />
                    }
                  >
                    {field.value ? (
                      formatIST(field.value as Date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </PopoverTrigger>
                </FormControl>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value as Date}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel className="text-black font-bold">Category</FormLabel>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <div key={category}>
                <FormField
                  control={form.control as any}
                  name="categories"
                  render={({ field }) => {
                    return (
                      <FormItem
                        className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-2"
                      >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(category)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), category])
                              : field.onChange(
                                  field.value?.filter(
                                    (value: string) => value !== category
                                  )
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        {category}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
              </div>
            ))}
          </div>
          <FormMessage>{form.formState.errors.categories?.message}</FormMessage>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black font-bold">Price (₹)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="rewards"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black font-bold">Rewards</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {customer ? 'Update Customer' : 'Create Customer'}
        </Button>
      </form>
    </Form>
  );
}
