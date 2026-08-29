import { LayoutDashboard, Users, PlusCircle, Settings, FileText, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customer Directory', icon: Users },
    { id: 'settings', label: 'Point Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white text-black flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <h1 className="text-2xl font-serif tracking-widest text-[#B08D57] uppercase border-b border-[#B08D57]/30 pb-4">
          Johya
        </h1>
        <p className="text-[10px] tracking-[0.2em] mt-2 opacity-60 uppercase font-bold">
          Fashions • Management
        </p>
      </div>

      <nav className="flex-grow mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id || (item.id === 'customers' && currentPage === 'create');
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full px-6 py-3 flex items-center gap-3 transition-all duration-200",
                isActive 
                  ? "bg-[#B08D57]/10 border-l-4 border-[#B08D57] text-[#B08D57]" 
                  : "opacity-60 hover:opacity-100 hover:bg-[#F2F2F2]"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-8 opacity-40 text-[10px] uppercase tracking-wider">
        &copy; 2024 JOHYA FASHIONS SYSTEM v1.0.4
      </div>
    </aside>
  );
}
