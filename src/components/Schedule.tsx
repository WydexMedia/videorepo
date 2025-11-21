"use client";

import { Card } from "@/components/ui/card";

interface ScheduleEvent {
  day: string;
  time: string;
  title: string;
  color: string;
}

const scheduleEvents: ScheduleEvent[] = [
  { day: "Sun", time: "08:00", title: "Clearly display the name", color: "bg-yellow-200 border-yellow-300" },
  { day: "Wed", time: "07:00", title: "Clearly display the name", color: "bg-blue-200 border-blue-300" },
  { day: "Mon", time: "10:00", title: "Clearly display the name", color: "bg-green-200 border-green-300" },
  { day: "Thu", time: "12:00", title: "Clearly display the name", color: "bg-pink-200 border-pink-300" },
];

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const timeSlots = ["08:00", "07:00", "10:00", "12:00"];

export default function Schedule() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">My Schedule</h2>

      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="text-sm font-medium text-gray-600"></div>
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-sm text-gray-600 flex items-center">{time}</div>
              {weekDays.map((day) => {
                const event = scheduleEvents.find(e => e.day === day && e.time === time);
                return (
                  <div key={`${day}-${time}`} className="min-h-[60px] flex items-center justify-center">
                    {event ? (
                      <div className={`${event.color} border rounded-lg px-3 py-2 w-full text-xs font-medium text-gray-700 text-center`}>
                        {event.title}
                      </div>
                    ) : (
                      <div className="w-full h-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

