"use client";

import { useTheme } from "next-themes";
import { Search, Bell, Moon, SunMedium, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemo, useCallback, memo } from "react";

interface DashboardHeaderProps {
  userName?: string;
  userAvatar?: string;
  phoneNumber?: string;
  countryCode?: string;
  memberSince?: string;
  onLogout?: () => void;
}

function DashboardHeader({
  userName = "User",
  userAvatar,
  phoneNumber,
  countryCode,
  memberSince,
  onLogout,
}: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  const formattedMemberSince = useMemo(() => {
    return memberSince ? new Date(memberSince).toLocaleDateString() : undefined;
  }, [memberSince]);

  return (
    <header className="bg-card border-b border-border px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search.."
              className="w-full pl-10 pr-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4 ml-6">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <SunMedium className="w-5 h-5 text-gray-600" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Notifications */}
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>

          {/* User Avatar / Profile Popup */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <Avatar className="w-9 h-9 cursor-pointer">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-500 text-white">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 mt-2 shadow-xl border border-gray-200"
            >
              <DropdownMenuLabel className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-500 text-white">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{userName}</p>
                  {phoneNumber && (
                    <p className="text-xs text-gray-500">
                      +{countryCode} {phoneNumber}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 text-gray-700 cursor-default">
                <User className="w-4 h-4 text-gray-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium">Account</span>
                  {formattedMemberSince && (
                    <span className="text-[11px] text-gray-500">
                      Member since {formattedMemberSince}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onLogout?.()}
                className="flex items-center gap-2 text-red-600 focus:bg-red-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default memo(DashboardHeader);

