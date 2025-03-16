import React, { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, Clock, Tag, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Простіша версія інтерфейсу для пропсів
interface AddTaskFormProps {
  initialDate: Date;
  onSubmit: (task: {
    title: string;
    description?: string;
    date: Date;
    time: string;
    category?: string;
  }) => void;
  onCancel: () => void;
}

export function AddTaskForm({ initialDate, onSubmit, onCancel }: AddTaskFormProps) {
  // Базовий стан форми
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: initialDate,
    time: "12:00",
    category: "",
  });

  // Стан валідації та відправки
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Стан голосового введення
  const [isListening, setIsListening] = useState(false);
  const [activeField, setActiveField] = useState<"title" | "description" | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Ініціалізація SpeechRecognition при першому рендері
  useEffect(() => {
    // Перевірка підтримки API розпізнавання мови у браузері
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'uk-UA'; // Встановлюємо українську мову

      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        if (activeField) {
          setFormData(prev => ({ 
            ...prev, 
            [activeField]: transcript 
          }));
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Помилка розпізнавання мови:', event.error);
        setIsListening(false);
        toast({
          title: "Помилка голосового введення",
          description: `Не вдалося розпізнати голос: ${event.error}`,
          variant: "destructive",
        });
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  // Функція для запуску/зупинки голосового введення
  const toggleSpeechRecognition = (field: "title" | "description") => {
    if (!recognition) {
      toast({
        title: "Не підтримується",
        description: "Ваш браузер не підтримує голосове введення",
        variant: "destructive",
      });
      return;
    }

    if (isListening && activeField === field) {
      recognition.stop();
      setIsListening(false);
      setActiveField(null);
    } else {
      if (isListening) {
        recognition.stop();
      }
      setActiveField(field);
      setIsListening(true);
      recognition.start();
      
      toast({
        title: "Голосове введення активовано",
        description: `Диктуйте ${field === "title" ? "назву" : "опис"} задачі`,
      });
    }
  };

  // Обробники зміни полів
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Очищення помилок при зміні
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Обробник зміни дати
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date }));
    }
  };

  // Обробник зміни категорії
  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  // Валідація форми
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = "Назва задачі обов'язкова";
    }

    // Додайте додаткову валідацію за потреби

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обробник відправки форми
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Зупиняємо голосове введення при відправці форми
    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
      setActiveField(null);
    }
    
    // Валідація перед відправкою
    if (!validateForm()) {
      toast({
        title: "Помилка валідації",
        description: "Будь ласка, заповніть всі обов'язкові поля",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Підготовка даних для відправки
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: formData.date,
        time: formData.time,
        category: formData.category || undefined,
      };

      // Відправка даних
      onSubmit(taskData);
      
      toast({
        title: "Задачу збережено!",
        description: "Нову задачу було успішно додано до календаря",
      });
    } catch (error) {
      console.error("Помилка при збереженні задачі:", error);
      toast({
        title: "Помилка збереження",
        description: "Не вдалося зберегти задачу. Спробуйте ще раз.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Нова задача</h2>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={onCancel}
          className="rounded-full h-8 w-8"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* Назва задачі */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="title" className="block text-sm font-medium">
              Назва задачі *
            </label>
            <Button
              type="button"
              variant={isListening && activeField === "title" ? "default" : "outline"}
              size="icon"
              className={`h-6 w-6 rounded-full ${isListening && activeField === "title" ? "bg-neon-green text-black animate-pulse-neon" : ""}`}
              onClick={() => toggleSpeechRecognition("title")}
            >
              {isListening && activeField === "title" ? (
                <MicOff className="h-3 w-3" />
              ) : (
                <Mic className="h-3 w-3" />
              )}
            </Button>
          </div>
          <Input
            id="title"
            name="title"
            placeholder="Введіть назву задачі"
            value={formData.title}
            onChange={handleInputChange}
            className={`glass-card border-neon-green/50 focus-visible:ring-neon-green ${isListening && activeField === "title" ? "border-neon-green animate-pulse-neon" : ""}`}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-destructive text-xs mt-1">{errors.title}</p>
          )}
        </div>

        {/* Опис задачі */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="description" className="block text-sm font-medium">
              Опис (необов'язково)
            </label>
            <Button
              type="button"
              variant={isListening && activeField === "description" ? "default" : "outline"}
              size="icon"
              className={`h-6 w-6 rounded-full ${isListening && activeField === "description" ? "bg-neon-green text-black animate-pulse-neon" : ""}`}
              onClick={() => toggleSpeechRecognition("description")}
            >
              {isListening && activeField === "description" ? (
                <MicOff className="h-3 w-3" />
              ) : (
                <Mic className="h-3 w-3" />
              )}
            </Button>
          </div>
          <Textarea
            id="description"
            name="description"
            placeholder="Додайте опис задачі"
            value={formData.description}
            onChange={handleInputChange}
            className={`min-h-[100px] glass-card border-neon-green/50 focus-visible:ring-neon-green ${isListening && activeField === "description" ? "border-neon-green animate-pulse-neon" : ""}`}
          />
        </div>
        
        {/* Дата і час */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Дата
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal glass-card border-neon-green/50"
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.date, "PP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={handleDateChange}
                  initialFocus
                  classNames={{
                    day_selected: "bg-neon-green text-black",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium mb-1">
              Час
            </label>
            <div className="relative flex items-center">
              <Clock className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="pl-10 glass-card border-neon-green/50 focus-visible:ring-neon-green"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
        
        {/* Категорія */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Категорія
          </label>
          <Select value={formData.category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full glass-card border-neon-green/50">
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Виберіть категорію" />
              </div>
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
      </div>
      
      {/* Кнопки форми */}
      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full neon-button py-6 text-base font-bold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Збереження..." : "Зберегти задачу"}
        </Button>
      </div>
    </form>
  );
}
