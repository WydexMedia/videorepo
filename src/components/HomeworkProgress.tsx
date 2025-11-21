"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, MoreVertical } from "lucide-react";

interface HomeworkItem {
  title: string;
  description: string;
  progress: number;
}

const homeworkItems: HomeworkItem[] = [
  {
    title: "Optimizing work",
    description: "In today's fast-paced world, an efficient work schedule.",
    progress: 33,
  },
  {
    title: "Optimizing work",
    description: "In today's fast-paced world, an efficient work schedule.",
    progress: 99,
  },
  {
    title: "Optimizing work",
    description: "In today's fast-paced world, an efficient work schedule.",
    progress: 66,
  },
];

export default function HomeworkProgress() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Homework progress</h2>
        <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="space-y-4">
        {homeworkItems.map((item, index) => (
          <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors ml-2">
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Progress value={item.progress} className="flex-1 h-2" />
              <span className="text-sm font-semibold text-blue-600 min-w-[3ch] text-right">
                {item.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

