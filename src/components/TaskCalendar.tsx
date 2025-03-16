import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { uk } from "date-fns/locale";

interface TaskCalendarProps {
  onDateSelect: (date: Date) => void;
  onAddTask: (date: Date) => void;
  selectedDate: Date;
}

export function TaskCalendar({ onDateSelect, onAddTask, selectedDate }: TaskCalendarProps) {
  const [date, setDate] = useState<Date>(selectedDate);
  const [isHovering, setIsHovering] = useState(false);

  const handleSelect = (newDate: Date | undefined) => {
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
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          className="rounded-md"
          locale={uk}
          classNames={{
            day_selected: "bg-gray-200 text-gray-900 hover:bg-gray-300 hover:text-gray-900 focus:bg-gray-300 focus:text-gray-900 focus:outline-none",
            day_today: "border-2 border-gray-400 text-gray-700 font-bold",
            day: "hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
          }}
          onDayClick={(day) => {
            // Додатковий ефект при натисканні на день
            const element = document.activeElement as HTMLElement;
            if (element) {
              element.blur();
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
