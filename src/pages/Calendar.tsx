
import { useState, useEffect } from "react";
import { addMonths, subMonths } from "date-fns";
import { CalendarEvent } from "@/components/EventForm";
import CalendarHeader from "@/components/CalendarHeader";
import CalendarGrid from "@/components/CalendarGrid";
import EventList from "@/components/EventList";
import EventForm from "@/components/EventForm";
import { useToast } from "@/hooks/use-toast";

const Calendar = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem("calendarEvents");
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents);
        // Convert string dates back to Date objects
        const eventsWithDates = parsedEvents.map((event: any) => ({
          ...event,
          date: new Date(event.date),
        }));
        setEvents(eventsWithDates);
      } catch (error) {
        console.error("Failed to parse saved events:", error);
        toast({
          title: "Error",
          description: "Failed to load saved events",
          variant: "destructive",
        });
      }
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleAddEvent = () => {
    setIsAddEventOpen(true);
  };

  const handleEventAdd = (newEvent: CalendarEvent) => {
    setEvents([...events, newEvent]);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents(
      events.map((event) => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-2xl font-bold mb-6">Verve Calendar</h1>
        
        <div className="mb-6">
          <CalendarHeader 
            currentDate={currentDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onAddEvent={handleAddEvent}
            isConnected={isGoogleConnected}
            setIsConnected={setIsGoogleConnected}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CalendarGrid
              currentDate={currentDate}
              events={events}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
          <div>
            <EventList
              selectedDate={selectedDate}
              events={events}
              onEventUpdate={handleEventUpdate}
            />
          </div>
        </div>

        <EventForm 
          isOpen={isAddEventOpen} 
          onClose={() => setIsAddEventOpen(false)} 
          onEventAdd={handleEventAdd}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
};

export default Calendar;
