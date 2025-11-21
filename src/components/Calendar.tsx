"use client";

import { useState, useMemo, useCallback, useEffect, memo } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

// Move outside component to avoid recreation
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// Move outside component
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

function Calendar({ selectedDate, onDateSelect }: CalendarProps) {
  const today = useMemo(() => new Date(), []);
  const initialDate = useMemo(() => selectedDate || today, [selectedDate, today]);

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [internalSelectedDate, setInternalSelectedDate] = useState(initialDate);

  // Sync with prop changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
      setInternalSelectedDate(selectedDate);
    }
  }, [selectedDate]);

  const startOfWeek = useMemo(() => getStartOfWeek(currentDate), [currentDate]);
  
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + index);
      return d;
    });
  }, [startOfWeek]);
  
  const nextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const prevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  return (
    <Card className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Week Days */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDates.map((date) => (
            <div
              key={`label-${date.toDateString()}`}
              className="text-center text-sm font-medium text-gray-600 py-2"
            >
              {weekDayLabels[date.getDay()]}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date) => {
            const isSelected =
              internalSelectedDate &&
              date.toDateString() === internalSelectedDate.toDateString();
            const isToday = date.toDateString() === today.toDateString();

            const baseClasses =
              "aspect-square flex items-center justify-center rounded-xl text-base font-medium transition-all duration-200";

            const stateClasses = isSelected
              ? "bg-blue-600 text-white shadow-md"
              : isToday
                ? "bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700";

            return (
              <button
                key={date.toDateString()}
                onClick={() => {
                  const newDate = new Date(date);
                  setInternalSelectedDate(newDate);
                  onDateSelect?.(newDate);
                }}
                className={`${baseClasses} ${stateClasses}`}
              >
                {date.getDate().toString().padStart(2, "0")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Community Growth */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900">Community growth</h4>
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#E5E7EB"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#6366F1"
                strokeWidth="6"
                fill="none"
                strokeDasharray="175.93"
                strokeDashoffset="43.98"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-900">62%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-green-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="font-medium">Increase to 19.6%</span>
        </div>
      </div>
    </Card>
  );
}

export default memo(Calendar);

