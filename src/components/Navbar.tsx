import { LayoutDashboard, Users, Settings, LogOut, ShieldCheck, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthUser } from '@/types/auth';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export default function Sidebar({ currentPage, onPageChange, user, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customer Directory', icon: Users },
    { id: 'settings', label: 'Point Settings', icon: Settings },
  ];

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <aside className="w-64 bg-white text-black flex flex-col h-screen sticky top-0 border-r border-[#EFEFEF] select-none shadow-sm">
      <div className="p-8 pb-4">
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
                "w-full px-6 py-3 flex items-center gap-3 transition-all duration-200 cursor-pointer text-left",
                isActive 
                  ? "bg-[#B08D57]/10 border-l-4 border-[#B08D57] text-[#B08D57] font-semibold" 
                  : "text-neutral-600 hover:text-black hover:bg-[#F8F8F8]"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Information & Logout */}
      {user && (
        <div className="p-4 mx-4 mb-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B08D57] to-[#8C6D39] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-900 truncate">
                  {user.name}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#B08D57]/15 text-[#8C6D39] border border-[#B08D57]/30">
                    <Crown className="w-2.5 h-2.5" /> Super Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-200 text-neutral-800 border border-neutral-300">
                    <ShieldCheck className="w-2.5 h-2.5" /> Store Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      )}

      <div className="p-6 pt-0 opacity-40 text-[10px] uppercase tracking-wider text-center">
        &copy; {new Date().getFullYear()} JOHYA FASHIONS SYSTEM
      </div>
    </aside>
  );
}
