import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/components/TasksList";

interface EditTaskDialogProps {
  task: Task;
  onClose: () => void;
  onEdit: (id: string, updatedTask: Partial<Task>) => void;
}

export function EditTaskDialog({ task, onClose, onEdit }: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [category, setCategory] = useState(task.category || "");
  
  // Безпечно отримуємо час з дати
  const getTimeFromDate = (date: Date): string => {
    try {
      return date.toTimeString().slice(0, 5);
    } catch (error) {
      console.error("Помилка отримання часу з дати:", error);
      return "12:00"; // Значення за замовчуванням
    }
  };
  
  const [time, setTime] = useState(getTimeFromDate(task.date));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Створюємо нову дату на основі поточної дати задачі
      const newDate = new Date(task.date);
      
      // Розбираємо час на години та хвилини
      const [hours, minutes] = time.split(":").map(Number);
      
      // Встановлюємо години та хвилини
      newDate.setHours(hours, minutes, 0, 0);
      
      // Перевіряємо, чи валідна дата
      if (isNaN(newDate.getTime())) {
        throw new Error("Невалідна дата");
      }
      
      onEdit(task.id, {
        title,
        description: description || undefined,
        category: category || undefined,
        date: newDate,
      });
      
      onClose();
    } catch (error) {
      console.error("Помилка при оновленні задачі:", error);
      alert("Виникла помилка при збереженні задачі. Будь ласка, спробуйте ще раз.");
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
            <Label htmlFor="time">Час</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
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