import axios from 'axios';
import { 
  CustomersResponse, 
  StatsResponse, 
  SingleCustomerResponse, 
  CustomerFormData 
} from '../types/customer';

const api = axios.create({
  baseURL: '/api',
});

export const customerApi = {
  getCustomers: async (params: any) => {
    const { data } = await api.get<CustomersResponse>('/customers', { params });
    return data;
  },
  getStats: async () => {
    const { data } = await api.get<StatsResponse>('/customers/stats');
    return data;
  },
  getCustomer: async (id: string) => {
    const { data } = await api.get<SingleCustomerResponse>(`/customers/${id}`);
    return data;
  },
  createCustomer: async (customerData: CustomerFormData) => {
    const { data } = await api.post<SingleCustomerResponse>('/customers', customerData);
    return data;
  },
  updateCustomer: async (id: string, customerData: Partial<CustomerFormData>) => {
    const { data } = await api.put<SingleCustomerResponse>(`/customers/${id}`, customerData);
    return data;
  },
  addPurchase: async (id: string, purchaseData: any) => {
    const { data } = await api.post<SingleCustomerResponse>(`/customers/${id}/purchases`, purchaseData);
    return data;
  },
  deleteCustomer: async (id: string) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/customers/${id}`);
    return data;
  },
};
