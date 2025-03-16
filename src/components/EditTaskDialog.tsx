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
  const [time, setTime] = useState(
    new Date(task.date).toTimeString().slice(0, 5)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const [hours, minutes] = time.split(":");
    const newDate = new Date(task.date);
    newDate.setHours(parseInt(hours), parseInt(minutes));

    onEdit(task.id, {
      title,
      description: description || undefined,
      category: category || undefined,
      date: newDate,
    });
    
    onClose();
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