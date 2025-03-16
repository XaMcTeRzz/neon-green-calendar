import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/components/TasksList";
import { v4 as uuidv4 } from "uuid";

interface AddTaskDialogProps {
  selectedDate: Date;
  onClose: () => void;
  onAdd: (task: Task) => void;
}

export function AddTaskDialog({ selectedDate, onClose, onAdd }: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [time, setTime] = useState("12:00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const [hours, minutes] = time.split(":");
    const taskDate = new Date(selectedDate);
    taskDate.setHours(parseInt(hours), parseInt(minutes));

    const newTask: Task = {
      id: uuidv4(),
      title,
      description: description || undefined,
      category: category || undefined,
      date: taskDate,
      completed: false,
    };
    
    onAdd(newTask);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Додати нову задачу</DialogTitle>
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
              Додати
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 