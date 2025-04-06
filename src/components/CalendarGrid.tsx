
import { useState, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CalendarEvent } from "./EventForm";

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export default function CalendarGrid({
  currentDate,
  events,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  useEffect(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    setCalendarDays(days);
  }, [currentDate]);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function getEventsForDate(date: Date): CalendarEvent[] {
    return events.filter((event) =>
      isSameDay(new Date(event.date), date)
    );
  }

  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <div className="grid grid-cols-7 bg-secondary">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((day, i) => {
          const eventsOnDay = getEventsForDate(day);
          return (
            <div
              key={i}
              className={cn(
                "min-h-[100px] p-2 border-t border-r",
                isSameMonth(day, currentDate) ? "bg-background" : "bg-muted/20",
                isSameDay(day, selectedDate) && "bg-accent",
                i % 7 === 6 && "border-r-0" // Remove right border on last column
              )}
              onClick={() => onSelectDate(day)}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center mb-1",
                  isSameDay(day, new Date()) && "bg-primary text-primary-foreground"
                )}
              >
                <span className="text-sm">
                  {format(day, "d")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {eventsOnDay.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs px-1 py-0.5 rounded truncate",
                      event.completed ? "bg-green-100 text-green-800" : "bg-primary/10 text-primary"
                    )}
                    title={event.title}
                  >
                    {event.startTime} {event.title}
                  </div>
                ))}
                {eventsOnDay.length > 2 && (
                  <Badge variant="outline" className="w-fit text-xs">
                    +{eventsOnDay.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
