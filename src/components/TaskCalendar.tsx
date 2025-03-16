
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TaskCalendarProps {
  onDateSelect: (date: Date) => void;
  onAddTask: (date: Date) => void;
  selectedDate: Date;
}

export function TaskCalendar({ onDateSelect, onAddTask, selectedDate }: TaskCalendarProps) {
  const [date, setDate] = useState<Date>(selectedDate);

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
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-3">
        <div className="mb-2 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-primary">Календар</h2>
          <button
            onClick={handleAddTask}
            className="neon-button p-1 w-8 h-8 flex items-center justify-center"
            aria-label="Додати задачу"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          className="rounded-md"
          classNames={{
            day_selected: "bg-neon-green text-black hover:bg-neon-green hover:text-black focus:bg-neon-green focus:text-black",
            day_today: "bg-accent/10 text-accent",
          }}
        />
      </CardContent>
    </Card>
  );
}
