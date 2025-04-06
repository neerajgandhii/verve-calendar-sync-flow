
import { useState } from "react";
import { CalendarEvent } from "./EventForm";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

interface EventListProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventUpdate: (updatedEvent: CalendarEvent) => void;
}

export default function EventList({
  selectedDate,
  events,
  onEventUpdate,
}: EventListProps) {
  const eventsForSelectedDate = events.filter((event) =>
    format(new Date(event.date), "yyyy-MM-dd") ===
    format(selectedDate, "yyyy-MM-dd")
  );

  const handleProgressChange = (value: number[], event: CalendarEvent) => {
    const progress = value[0];
    const updatedEvent = {
      ...event,
      progress,
      completed: progress === 100,
    };
    onEventUpdate(updatedEvent);

    if (progress === 100 && !event.completed) {
      toast({
        title: "Task completed",
        description: `${event.title} has been marked as complete`,
      });
    }
  };

  const handleCheckboxChange = (checked: boolean | "indeterminate", event: CalendarEvent) => {
    if (typeof checked === "boolean") {
      const updatedEvent = {
        ...event,
        completed: checked,
        progress: checked ? 100 : 0,
      };
      onEventUpdate(updatedEvent);

      if (checked) {
        toast({
          title: "Task completed",
          description: `${event.title} has been marked as complete`,
        });
      }
    }
  };

  return (
    <div className="border rounded-md p-4 bg-white h-full shadow-sm">
      <h3 className="font-semibold mb-4 text-lg">
        Events for {format(selectedDate, "MMMM d, yyyy")}
      </h3>
      {eventsForSelectedDate.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No events scheduled for today
        </div>
      ) : (
        <div className="space-y-4">
          {eventsForSelectedDate.map((event) => (
            <div key={event.id} className="border rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <div className="text-sm text-muted-foreground">
                    {event.startTime} - {event.endTime}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {event.googleEventId && (
                    <Badge variant="secondary" className="ml-2">
                      Google
                    </Badge>
                  )}
                  <Badge variant={event.completed ? "default" : "outline"}>
                    {event.completed ? "Completed" : "In Progress"}
                  </Badge>
                </div>
              </div>
              
              {event.description && (
                <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
              )}

              <div className="space-y-4 mt-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center space-x-2">
                    <Checkbox 
                      checked={event.completed} 
                      onCheckedChange={(checked) => handleCheckboxChange(checked, event)}
                    />
                    <span>Mark as complete</span>
                  </label>
                  <div className="text-sm font-medium">
                    {event.progress}%
                  </div>
                </div>
                <div className="pt-2">
                  <Slider
                    defaultValue={[event.progress]}
                    max={100}
                    step={10}
                    value={[event.progress]}
                    onValueChange={(value) => handleProgressChange(value, event)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
