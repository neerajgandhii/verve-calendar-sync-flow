
import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "@/hooks/use-toast";

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddEvent: () => void;
  isConnected: boolean;
  setIsConnected: (token: string) => void;
}

export default function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onAddEvent,
  isConnected,
  setIsConnected
}: CalendarHeaderProps) {
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      console.log("Google login success:", codeResponse);
      setIsConnected(codeResponse.access_token);
      toast({
        title: "Success",
        description: "Connected to Google Calendar",
      });
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Google login failed:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Google Calendar",
        variant: "destructive",
      });
      setIsLoading(false);
    },
    scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
  });

  const handleGoogleConnect = () => {
    setIsLoading(true);
    login();
  };

  return (
    <div className="flex items-center justify-between border-b pb-4 mb-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onPrevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-2">
        <Button
          variant={isConnected ? "outline" : "default"}
          className="gap-2"
          onClick={handleGoogleConnect}
          disabled={isLoading || isConnected}
        >
          <CalendarIcon className="h-4 w-4" />
          {isConnected ? "Connected to Google Calendar" : "Connect Google Calendar"}
          {isLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
        </Button>
        <Button 
          variant="default"
          onClick={onAddEvent} 
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>
    </div>
  );
}
