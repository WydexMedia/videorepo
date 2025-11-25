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
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-blue-50/30 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={prevMonth}
          className="p-1.5 sm:p-2 hover:bg-blue-100 rounded-lg transition-colors group"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-blue-600" />
        </button>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1.5 sm:p-2 hover:bg-blue-100 rounded-lg transition-colors group"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-blue-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1.5 sm:space-y-2">
        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
          {weekDates.map((date) => (
            <div
              key={`label-${date.toDateString()}`}
              className="text-center text-[10px] sm:text-sm font-semibold text-gray-500 py-1 sm:py-2"
            >
              {weekDayLabels[date.getDay()]}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDates.map((date) => {
            const isSelected =
              internalSelectedDate &&
              date.toDateString() === internalSelectedDate.toDateString();
            const isToday = date.toDateString() === today.toDateString();

            const baseClasses =
              "aspect-square flex items-center justify-center rounded-lg sm:rounded-xl text-xs sm:text-base font-semibold transition-all duration-200 cursor-pointer";

            const stateClasses = isSelected
              ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg scale-105 ring-2 ring-blue-300"
              : isToday
                ? "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-2 border-blue-400 font-bold"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 border border-gray-200 hover:border-blue-300 hover:shadow-md";

            return (
              <button
                key={date.toDateString()}
                onClick={() => {
                  const newDate = new Date(date);
                  setInternalSelectedDate(newDate);
                  onDateSelect?.(newDate);
                }}
                className={`${baseClasses} ${stateClasses}`}
                aria-label={`Select ${date.toLocaleDateString()}`}
              >
                {date.getDate().toString().padStart(2, "0")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Course Info */}
      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
        <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></span>
          Resin Art Course
        </h4>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Learn professional resin art techniques including mixing, pouring, curing, and finishing. 
          Master creating beautiful resin artworks from beginner to advanced level.
        </p>
      </div>
    </Card>
  );
}

export default memo(Calendar);

