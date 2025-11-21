"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle, Award } from "lucide-react";

interface CourseCardProps {
  teacherName: string;
  teacherAvatar: string;
  price: string;
  lessons: number;
  completed: number;
  achievements: number;
  completionPercentage: number;
  date: string;
  color: "purple" | "yellow" | "red";
}

const colorStyles = {
  purple: {
    bg: "from-purple-400 to-purple-300",
    avatar: "border-purple-200",
  },
  yellow: {
    bg: "from-yellow-400 to-yellow-300",
    avatar: "border-yellow-200",
  },
  red: {
    bg: "from-red-400 to-red-300",
    avatar: "border-red-200",
  },
};

export default function CourseCard({
  teacherName,
  teacherAvatar,
  price,
  lessons,
  completed,
  achievements,
  completionPercentage,
  date,
  color,
}: CourseCardProps) {
  const styles = colorStyles[color];

  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-200">
      {/* Gradient Header with Icon */}
      <div className={`bg-gradient-to-br ${styles.bg} h-32 relative flex items-center justify-center`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4">
            <div className="w-20 h-20 border-4 border-white/30 rounded-lg transform rotate-12"></div>
          </div>
        </div>
        <div className="relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-800/60 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Teacher Info */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className={`w-10 h-10 border-2 ${styles.avatar}`}>
            <AvatarImage src={teacherAvatar} alt={teacherName} />
            <AvatarFallback>{teacherName.split(" ").map(n => n[0]).join("")}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{teacherName}</h3>
            <Badge variant="outline" className="text-xs border-blue-200 text-blue-600 bg-blue-50">
              ${price}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{lessons}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            <span>{completed}</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span>{achievements}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Completed: <span className="font-semibold text-gray-900">{completionPercentage}%</span></span>
            <span className="text-gray-500">{date}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

