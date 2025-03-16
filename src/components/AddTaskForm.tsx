import { useState, useEffect } from "react";
import { Mic, X, Calendar as CalendarIcon, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Декларація типів для SpeechRecognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  error: any;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

// Інтерфейс для Props
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(initialDate);
  const [time, setTime] = useState("12:00");
  const [category, setCategory] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Ініціалізуємо розпізнавання мови
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore - Ігноруємо помилки типу, оскільки API може не бути повністю типізовано
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognitionAPI) {
          // @ts-ignore
          const recognitionInstance = new SpeechRecognitionAPI();
          
          recognitionInstance.lang = 'uk-UA'; // Українська мова
          recognitionInstance.continuous = true;
          recognitionInstance.interimResults = true;
          
          recognitionInstance.onresult = (event) => {
            // @ts-ignore
            const transcript = Array.from(event.results)
              // @ts-ignore
              .map(result => result[0].transcript)
              .join(' ');
              
            // @ts-ignore
            if (event.results[0].isFinal) {
              // Визначаємо, куди додавати текст - в заголовок чи опис
              if (!title || title.length < 5) {
                setTitle(transcript);
              } else {
                setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
              }
            }
          };
          
          recognitionInstance.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
            toast({
              title: "Помилка розпізнавання",
              description: `Виникла помилка: ${event.error}`,
              variant: "destructive",
            });
          };
          
          recognitionInstance.onend = () => {
            setIsRecording(false);
          };
          
          setRecognition(recognitionInstance);
        }
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
      }
    }
    
    // Очищення при розмонтуванні компонента
    return () => {
      if (recognition) {
        try {
          recognition.abort();
        } catch (e) {
          console.error('Error aborting recognition:', e);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Спроба відправити форму", { title, description, date, time, category });
    
    if (!title.trim()) {
      toast({
        title: "Необхідно вказати назву задачі",
        description: "Будь ласка, введіть назву задачі",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Зберігаємо задачу
      onSubmit({
        title,
        description: description || undefined,
        date,
        time,
        category: category || undefined,
      });
      
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

  const handleVoiceInput = () => {
    if (!recognition) {
      toast({
        title: "Не підтримується",
        description: "Ваш браузер не підтримує розпізнавання мови або доступ до мікрофона обмежений",
        variant: "destructive",
      });
      return;
    }
    
    if (isRecording) {
      // Зупиняємо запис
      try {
        recognition.stop();
        setIsRecording(false);
        toast({
          title: "Запис завершено",
          description: "Текст додано до задачі",
        });
      } catch (error) {
        console.error('Error stopping recognition:', error);
        setIsRecording(false);
      }
    } else {
      // Починаємо запис
      try {
        // Перевіряємо дозвіл на доступ до мікрофона
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            recognition.start();
            setIsRecording(true);
            toast({
              title: "Запис голосу...",
              description: "Говоріть чітко. Натисніть кнопку ще раз, щоб зупинити",
            });
          })
          .catch((err) => {
            console.error('Microphone access denied:', err);
            toast({
              title: "Доступ заборонено",
              description: "Немає доступу до мікрофона. Перевірте налаштування браузера.",
              variant: "destructive",
            });
          });
      } catch (error) {
        console.error('Speech recognition error:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося запустити розпізнавання голосу",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
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
      
      <div className="space-y-3">
        <div>
          <Input
            placeholder="Назва задачі"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="glass-card border-neon-green/50 focus-visible:ring-neon-green"
          />
        </div>
        
        <div className="relative">
          <Textarea
            placeholder="Опис задачі (опціонально)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px] glass-card border-neon-green/50 focus-visible:ring-neon-green"
          />
          <Button
            type="button"
            onClick={handleVoiceInput}
            className={`absolute bottom-2 right-2 rounded-full h-10 w-10 p-0 ${
              isRecording 
                ? "bg-destructive text-destructive-foreground animate-pulse" 
                : "bg-primary/20 text-primary hover:bg-primary/30"
            }`}
            disabled={isSubmitting}
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal glass-card border-neon-green/50"
                disabled={isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
                classNames={{
                  day_selected: "bg-neon-green text-black",
                }}
              />
            </PopoverContent>
          </Popover>

          <div className="relative flex items-center">
            <Clock className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="pl-10 glass-card border-neon-green/50 focus-visible:ring-neon-green"
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div className="relative">
          <Select value={category} onValueChange={setCategory}>
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
      
      <Button 
        type="submit" 
        className="w-full neon-button py-6 text-base font-bold animate-float"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Збереження..." : "Зберегти задачу"}
      </Button>
    </form>
  );
}
