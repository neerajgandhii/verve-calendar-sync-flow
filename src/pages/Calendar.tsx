
import { useState, useEffect } from "react";
import { addMonths, subMonths } from "date-fns";
import { CalendarEvent } from "@/components/EventForm";
import CalendarHeader from "@/components/CalendarHeader";
import CalendarGrid from "@/components/CalendarGrid";
import EventList from "@/components/EventList";
import EventForm from "@/components/EventForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Calendar = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  // Load events and check Google auth status on component mount
  useEffect(() => {
    // Check if user is authenticated with Google
    const storedToken = localStorage.getItem("googleAuthToken");
    if (storedToken) {
      setGoogleToken(storedToken);
      setIsGoogleConnected(true);
      fetchGoogleEvents(storedToken);
    }

    // Load local events from localStorage
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
    
    // If connected to Google, sync the new event to Google Calendar
    if (isGoogleConnected && googleToken) {
      syncEventsToGoogle(events, googleToken);
    }
  }, [events]);

  const fetchGoogleEvents = async (token: string) => {
    try {
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 1);
      
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 2);
      
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired
          localStorage.removeItem("googleAuthToken");
          setIsGoogleConnected(false);
          setGoogleToken(null);
          toast({
            title: "Session Expired",
            description: "Your Google session has expired. Please reconnect.",
          });
          return;
        }
        throw new Error(`Google API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert Google events to our app format
      const googleEvents: CalendarEvent[] = data.items
        .filter((item: any) => item.status !== 'cancelled')
        .map((item: any) => {
          const startDate = item.start.dateTime ? new Date(item.start.dateTime) : new Date(item.start.date);
          const endDate = item.end.dateTime ? new Date(item.end.dateTime) : new Date(item.end.date);
          
          return {
            id: item.id,
            title: item.summary || 'Untitled Event',
            description: item.description || '',
            date: startDate,
            startTime: startDate.toTimeString().substring(0, 5),
            endTime: endDate.toTimeString().substring(0, 5),
            progress: item.extendedProperties?.private?.progress ? 
              parseInt(item.extendedProperties.private.progress) : 0,
            completed: item.extendedProperties?.private?.completed === 'true',
            googleEventId: item.id,
          };
        });
      
      // Merge Google events with local events, prioritizing local events with the same ID
      const localEventIds = events.map(e => e.googleEventId).filter(Boolean);
      const filteredGoogleEvents = googleEvents.filter(e => !localEventIds.includes(e.googleEventId));
      
      setEvents(prev => {
        const mergedEvents = [...prev, ...filteredGoogleEvents];
        return mergedEvents;
      });
      
    } catch (error) {
      console.error("Failed to fetch Google Calendar events:", error);
      toast({
        title: "Error",
        description: "Failed to fetch events from Google Calendar",
        variant: "destructive",
      });
    }
  };

  const syncEventsToGoogle = async (allEvents: CalendarEvent[], token: string) => {
    // Only sync events that don't have a Google ID yet
    const eventsToSync = allEvents.filter(event => !event.googleEventId);
    
    for (const event of eventsToSync) {
      try {
        // Format the event for Google Calendar
        const startDateTime = new Date(event.date);
        const [startHours, startMinutes] = event.startTime.split(':').map(Number);
        startDateTime.setHours(startHours, startMinutes);
        
        const endDateTime = new Date(event.date);
        const [endHours, endMinutes] = event.endTime.split(':').map(Number);
        endDateTime.setHours(endHours, endMinutes);
        
        const googleEvent = {
          summary: event.title,
          description: event.description,
          start: {
            dateTime: startDateTime.toISOString(),
          },
          end: {
            dateTime: endDateTime.toISOString(),
          },
          extendedProperties: {
            private: {
              progress: String(event.progress),
              completed: String(event.completed),
              localEventId: event.id,
            },
          },
        };
        
        // Create the event in Google Calendar
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Token expired
            localStorage.removeItem("googleAuthToken");
            setIsGoogleConnected(false);
            setGoogleToken(null);
            toast({
              title: "Session Expired",
              description: "Your Google session has expired. Please reconnect.",
            });
            return;
          }
          throw new Error(`Google API error: ${response.status}`);
        }
        
        const createdEvent = await response.json();
        
        // Update the local event with the Google event ID
        setEvents(prev => prev.map(e => 
          e.id === event.id ? { ...e, googleEventId: createdEvent.id } : e
        ));
        
      } catch (error) {
        console.error("Failed to sync event to Google Calendar:", error);
        toast({
          title: "Sync Error",
          description: `Failed to sync "${event.title}" to Google Calendar`,
          variant: "destructive",
        });
      }
    }
  };

  const updateGoogleEvent = async (event: CalendarEvent) => {
    if (!isGoogleConnected || !googleToken || !event.googleEventId) return;
    
    try {
      // Format the event for Google Calendar
      const startDateTime = new Date(event.date);
      const [startHours, startMinutes] = event.startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes);
      
      const endDateTime = new Date(event.date);
      const [endHours, endMinutes] = event.endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes);
      
      const googleEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: startDateTime.toISOString(),
        },
        end: {
          dateTime: endDateTime.toISOString(),
        },
        extendedProperties: {
          private: {
            progress: String(event.progress),
            completed: String(event.completed),
            localEventId: event.id,
          },
        },
      };
      
      // Update the event in Google Calendar
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.googleEventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired
          localStorage.removeItem("googleAuthToken");
          setIsGoogleConnected(false);
          setGoogleToken(null);
          toast({
            title: "Session Expired",
            description: "Your Google session has expired. Please reconnect.",
          });
          return;
        }
        throw new Error(`Google API error: ${response.status}`);
      }
      
    } catch (error) {
      console.error("Failed to update event in Google Calendar:", error);
      toast({
        title: "Sync Error",
        description: `Failed to update "${event.title}" in Google Calendar`,
        variant: "destructive",
      });
    }
  };

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
    setEvents(prev => [...prev, newEvent]);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents(prev =>
      prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
    
    // If the event has a Google ID, update it in Google Calendar
    if (updatedEvent.googleEventId) {
      updateGoogleEvent(updatedEvent);
    }
  };

  const handleGoogleConnect = (token: string) => {
    setGoogleToken(token);
    localStorage.setItem("googleAuthToken", token);
    setIsGoogleConnected(true);
    fetchGoogleEvents(token);
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
            setIsConnected={handleGoogleConnect}
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
