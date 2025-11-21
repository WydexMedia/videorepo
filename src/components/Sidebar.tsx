"use client";

import { useCallback, memo } from "react";
import { Home, Users, UserCheck, BookOpen, Video, BarChart3, Library, CreditCard, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

// Move outside component to avoid recreation
const navigationItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "students", label: "Students", icon: Users },
  { id: "teachers", label: "Teachers", icon: UserCheck },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "live-class", label: "Live Class", icon: Video },
  { id: "attendance", label: "Attendance", icon: BarChart3 },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "library", label: "Library", icon: Library },
  { id: "reports", label: "Reports", icon: AlertTriangle },
] as const;

function Sidebar({ activeItem = "home", onNavigate }: SidebarProps) {
  const handleClick = useCallback((itemId: string) => {
    onNavigate?.(itemId);
  }, [onNavigate]);

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-6 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <div className="w-6 h-6 bg-white/90 rounded" style={{ clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 100%)" }}></div>
        </div>
        <span className="text-xl font-bold text-foreground">SkillSet</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 pl-3"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-muted-foreground")} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Upgrade Section */}
      <div className="mt-auto pt-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-sky-900 dark:to-indigo-900 rounded-xl p-4 border border-blue-100/70 dark:border-sky-800">
          <p className="text-sm text-foreground font-medium mb-2">Upgrade to Pro for</p>
          <p className="text-xs text-muted-foreground mb-4">more facilities</p>
          <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2">
            Upgrade →
          </button>
        </div>
      </div>
    </aside>
  );
}

export default memo(Sidebar);

