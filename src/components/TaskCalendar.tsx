import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { uk } from "date-fns/locale";

interface TaskCalendarProps {
  onDateSelect: (date: Date) => void;
  onAddTask: (date: Date) => void;
  selectedDate: Date;
}

export function TaskCalendar({ onDateSelect, onAddTask, selectedDate }: TaskCalendarProps) {
  const [date, setDate] = useState<Date>(selectedDate);
  const [isHovering, setIsHovering] = useState(false);

  const handleSelect = (newDate: Date | null) => {
    if (newDate) {
      setDate(newDate);
      onDateSelect(newDate);
      toast({
        title: "Дату вибрано",
        description: `Вибрано ${newDate.toLocaleDateString('uk')}`,
      });
    }
  };

  const handleAddTask = () => {
    onAddTask(date);
    toast({
      title: "Додавання задачі",
      description: `Створення нової задачі на ${date.toLocaleDateString('uk')}`,
    });
  };

  // Кастомні стилі для календаря
  const calendarStyles = `
    .react-datepicker {
      font-family: 'Inter', sans-serif;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      background-color: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      box-shadow: 0 0 15px rgba(57, 255, 20, 0.3);
    }
    .react-datepicker__header {
      background-color: transparent;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 0.8rem;
    }
    .react-datepicker__current-month {
      color: rgba(57, 255, 20, 0.9);
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .react-datepicker__day-name {
      color: rgba(255, 255, 255, 0.7);
      margin: 0.4rem;
    }
    .react-datepicker__day {
      margin: 0.4rem;
      color: rgba(255, 255, 255, 0.9);
      border-radius: 0.3rem;
      transition: all 0.2s ease;
    }
    .react-datepicker__day:hover {
      background-color: rgba(57, 255, 20, 0.2);
    }
    .react-datepicker__day--selected {
      background-color: rgba(57, 255, 20, 0.3);
      color: white;
    }
    .react-datepicker__day--today {
      border: 2px solid rgba(255, 255, 255, 0.5);
      font-weight: bold;
    }
    .react-datepicker__navigation {
      top: 1rem;
    }
    .react-datepicker__navigation-icon::before {
      border-color: rgba(57, 255, 20, 0.7);
    }
    .react-datepicker__navigation:hover *::before {
      border-color: rgba(57, 255, 20, 1);
    }
  `;

  return (
    <Card className="glass-card overflow-hidden w-full max-w-sm animate-float shadow-[0_0_15px_rgba(57,255,20,0.5)] hover:shadow-[0_0_25px_rgba(57,255,20,0.7)]">
      <CardContent className="p-3">
        <div className="mb-2 flex justify-between items-center">
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-primary animate-glow" />
            <h2 className="text-lg font-semibold text-neon-green animate-neon-glow">Календар</h2>
          </div>
          <button
            onClick={handleAddTask}
            className="neon-button p-1 w-10 h-10 flex items-center justify-center"
            aria-label="Додати задачу"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <Plus className={`h-6 w-6 ${isHovering ? 'animate-spin-slow' : ''}`} />
          </button>
        </div>
        
        <style>{calendarStyles}</style>
        
        <DatePicker
          selected={date}
          onChange={handleSelect}
          inline
          locale={uk}
          calendarClassName="w-full"
          dayClassName={date => 
            "hover:bg-opacity-20 hover:bg-neon-green"
          }
          formatWeekDay={nameOfDay => nameOfDay.substring(0, 3)}
        />
      </CardContent>
    </Card>
  );
}
