import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/components/TasksList";
import { toast } from "@/hooks/use-toast";

interface EditTaskDialogProps {
  task: Task;
  onClose: () => void;
  onEdit: (id: string, updatedTask: { title: string; description?: string; date: Date; category?: string }) => void;
}

export function EditTaskDialog({ task, onClose, onEdit }: EditTaskDialogProps) {
  // Стан для полів форми
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [category, setCategory] = useState(task.category || "");
  const [date, setDate] = useState<Date>(new Date(task.date));
  const [time, setTime] = useState("");
  
  // Ініціалізація часу при завантаженні компонента
  useEffect(() => {
    try {
      // Отримуємо час з дати задачі
      const taskDate = new Date(task.date);
      if (!isNaN(taskDate.getTime())) {
        const hours = String(taskDate.getHours()).padStart(2, '0');
        const minutes = String(taskDate.getMinutes()).padStart(2, '0');
        setTime(`${hours}:${minutes}`);
        setDate(taskDate);
      } else {
        // Якщо дата невалідна, встановлюємо поточний час
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setTime(`${hours}:${minutes}`);
        setDate(now);
      }
    } catch (error) {
      console.error("Помилка при ініціалізації часу:", error);
      // Встановлюємо значення за замовчуванням
      setTime("12:00");
      setDate(new Date());
    }
  }, [task.date]);
  
  // Форматування дати для поля input type="date"
  const formatDateForInput = (date: Date): string => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Помилка форматування дати:", error);
      return new Date().toISOString().split('T')[0];
    }
  };
  
  // Обробник зміни дати
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const newDate = new Date(e.target.value);
      if (!isNaN(newDate.getTime())) {
        // Зберігаємо поточний час
        const currentDate = new Date(date);
        newDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0);
        setDate(newDate);
      }
    } catch (error) {
      console.error("Помилка при зміні дати:", error);
      toast({
        title: "Помилка",
        description: "Невалідна дата. Будь ласка, спробуйте ще раз.",
        variant: "destructive",
      });
    }
  };
  
  // Обробник зміни часу
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    try {
      const [hours, minutes] = e.target.value.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      setDate(newDate);
    } catch (error) {
      console.error("Помилка при зміні часу:", error);
    }
  };
  
  // Обробник відправки форми
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Перевіряємо, чи валідна дата
      if (isNaN(date.getTime())) {
        throw new Error("Невалідна дата");
      }
      
      // Створюємо оновлений об'єкт задачі
      const updatedTask = {
        title,
        description: description || undefined,
        category: category || undefined,
        date: date,
      };
      
      // Викликаємо функцію редагування
      onEdit(task.id, updatedTask);
      
      // Закриваємо діалог
      onClose();
    } catch (error) {
      console.error("Помилка при оновленні задачі:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити задачу. Будь ласка, спробуйте ще раз.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редагувати задачу</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Назва задачі</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введіть назву задачі"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Опис (необов'язково)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Додайте опис задачі"
              className="resize-none"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Дата</Label>
            <Input
              id="date"
              type="date"
              value={formatDateForInput(date)}
              onChange={handleDateChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Час</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={handleTimeChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Категорія (необов'язково)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть категорію" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Без категорії</SelectItem>
                <SelectItem value="work">Робота</SelectItem>
                <SelectItem value="personal">Особисте</SelectItem>
                <SelectItem value="health">Здоров'я</SelectItem>
                <SelectItem value="education">Навчання</SelectItem>
                <SelectItem value="finance">Фінанси</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Скасувати
            </Button>
            <Button type="submit">
              Зберегти
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 