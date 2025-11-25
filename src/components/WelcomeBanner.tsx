"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";

interface WelcomeBannerProps {
  userName: string;
  progress: number;
}

function WelcomeBanner({ userName, progress }: WelcomeBannerProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 border-none overflow-hidden relative shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Left Content */}
        <div className="flex-1 text-white z-10 space-y-3 sm:space-y-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
            Welcome back, <span className="text-yellow-300">{userName}</span>!
          </h1>
          <div className="space-y-2">
            <p className="text-blue-50 text-base sm:text-lg lg:text-xl font-bold">
              Complete Resin Art Course: Zero to Hero
            </p>
            <p className="text-blue-100 text-xs sm:text-sm lg:text-base leading-relaxed max-w-xl">
              Master the art of resin crafting from basics to advanced techniques. Learn mixing, pouring, curing, and finishing professional resin artworks.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-2 pt-2 sm:pt-4">
            <div className="w-8 sm:w-12 h-1 sm:h-1.5 bg-white rounded-full shadow-lg"></div>
            <div className="w-8 sm:w-12 h-1 sm:h-1.5 bg-white/30 rounded-full"></div>
            <div className="w-8 sm:w-12 h-1 sm:h-1.5 bg-white/30 rounded-full"></div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/5 rounded-full -mr-32 sm:-mr-48 -mt-32 sm:-mt-48"></div>
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-600/10 rounded-full -ml-24 sm:-ml-32 -mb-24 sm:-mb-32"></div>
      </div>
    </Card>
  );
}

export default memo(WelcomeBanner);



