"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface WelcomeBannerProps {
  userName: string;
  progress: number;
}

function WelcomeBanner({ userName, progress }: WelcomeBannerProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 border-none overflow-hidden relative">
      <div className="p-8 flex items-center justify-between">
        {/* Left Content */}
        <div className="flex-1 text-white z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
          <p className="text-blue-50 mb-6">
            You&apos;ve learned {progress}% of your goal this week Keep it<br />up and improve your progress!
          </p>
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 border border-white/30">
            GO BACK TO THE LESSONS
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Progress Indicator */}
          <div className="flex gap-2 mt-6">
            <div className="w-12 h-1 bg-white rounded-full"></div>
            <div className="w-12 h-1 bg-white/30 rounded-full"></div>
            <div className="w-12 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative z-10">
          <div className="relative w-64 h-48">
            {/* Books Stack */}
            <div className="absolute right-0 bottom-0">
              {/* Bottom Book */}
              <div className="relative">
                <div className="w-48 h-16 bg-blue-100 rounded-lg shadow-xl transform perspective-1000"
                     style={{ transform: "rotateX(5deg) rotateY(-5deg)" }}>
                  <div className="absolute top-2 left-4 w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <div className="w-4 h-4 bg-white/80 rounded"></div>
                  </div>
                </div>

                {/* Top Book */}
                <div className="absolute -top-8 left-8 w-48 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg shadow-2xl transform"
                     style={{ transform: "rotateX(-5deg) rotateZ(-10deg)" }}>
                  <div className="absolute top-0 right-0 w-full h-6 bg-red-600 rounded-t-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full -ml-32 -mb-32"></div>
      </div>
    </Card>
  );
}

export default memo(WelcomeBanner);

