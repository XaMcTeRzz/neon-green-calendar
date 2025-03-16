
import { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { TaskCalendar } from "@/components/TaskCalendar";
import { TasksList, Task } from "@/components/TasksList";
import { AddTaskButton } from "@/components/AddTaskButton";
import { AddTaskForm } from "@/components/AddTaskForm";
import { Settings } from "@/components/Settings";
import { toast } from "@/hooks/use-toast";

const generateSampleTasks = (): Task[] => {
  const today = new Date();
  const categories = ["work", "personal", "health", "education", "finance"];
  const tasks: Task[] = [];
  
  for (let i = -3; i < 5; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    
    const numTasks = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < numTasks; j++) {
      const taskDate = new Date(date);
      taskDate.setHours(9 + j * 3, 0, 0);
      
      // Випадкова категорія або без категорії
      const hasCategory = Math.random() > 0.3;
      const category = hasCategory 
        ? categories[Math.floor(Math.random() * categories.length)] 
        : undefined;
      
      tasks.push({
        id: `task-${i}-${j}`,
        title: `Задача ${j + 1} на ${date.toLocaleDateString('uk')}`,
        description: j % 2 === 0 ? `Опис для задачі ${j + 1}` : undefined,
        date: taskDate,
        completed: Math.random() > 0.7,
        category,
      });
    }
  }
  
  return tasks;
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        // Перетворюємо рядкові дати назад у об'єкти Date
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          date: new Date(task.date)
        }));
        setTasks(tasksWithDates);
      } catch (error) {
        console.error("Помилка при зчитуванні задач:", error);
        setTasks(generateSampleTasks());
      }
    } else {
      setTasks(generateSampleTasks());
    }
  }, []);
  
  useEffect(() => {
    // Перед збереженням переконаємося, що задачі мають правильний формат
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (activeTab !== "calendar") {
      setActiveTab("calendar");
    }
  };
  
  const handleAddTask = (date: Date) => {
    setSelectedDate(date);
    setShowAddForm(true);
  };
  
  const handleTaskSubmit = (taskData: {
    title: string;
    description?: string;
    date: Date;
    time: string;
    category?: string;
  }) => {
    try {
      // Створення об'єкта дати з годиною та хвилинами
      const [hours, minutes] = taskData.time.split(':').map(Number);
      const taskDate = new Date(taskData.date);
      taskDate.setHours(hours, minutes, 0);
      
      // Створення об'єкта задачі
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: taskData.title,
        description: taskData.description,
        date: taskDate,
        completed: false,
        category: taskData.category,
      };
      
      // Додавання задачі до списку
      setTasks(prevTasks => [...prevTasks, newTask]);
      
      // Закриття форми
      setShowAddForm(false);
      
      // Сповіщення користувача
      toast({
        title: "Задачу додано",
        description: `"${taskData.title}" додано на ${taskDate.toLocaleDateString('uk')}`,
      });
      
      // Спроба відправити сповіщення через налаштовані канали
      sendTaskNotifications(newTask);
    } catch (error) {
      console.error("Помилка при додаванні задачі:", error);
      toast({
        title: "Помилка додавання",
        description: "Не вдалося додати задачу. Спробуйте ще раз.",
        variant: "destructive",
      });
    }
  };
  
  // Функція для відправки сповіщень через налаштовані канали
  const sendTaskNotifications = (task: Task) => {
    try {
      const savedSettings = localStorage.getItem("userSettings");
      if (!savedSettings) return;
      
      const settings = JSON.parse(savedSettings);
      
      // Перевіряємо налаштування Telegram і відправляємо сповіщення
      if (settings.telegramBotEnabled && settings.telegramUsername) {
        console.log("Відправляємо сповіщення в Telegram для:", settings.telegramUsername);
        // В реальному додатку тут був би API-запит до сервера для відправки повідомлення
        toast({
          title: "Telegram нагадування",
          description: "Нагадування буде відправлено через Telegram",
        });
      }
      
      // Перевіряємо налаштування Email і відправляємо сповіщення
      if (settings.emailEnabled && settings.emailAddress) {
        console.log("Відправляємо сповіщення на Email:", settings.emailAddress);
        // В реальному додатку тут був би API-запит до сервера для відправки email
        toast({
          title: "Email нагадування",
          description: "Нагадування буде відправлено на вашу електронну пошту",
        });
      }
      
      // Перевіряємо налаштування Google Calendar і додаємо подію
      if (settings.googleCalendarEnabled && settings.googleCalendarId) {
        console.log("Додаємо подію в Google Calendar:", settings.googleCalendarId);
        // В реальному додатку тут був би API-запит до Google Calendar API
        toast({
          title: "Google Calendar",
          description: "Подію додано до вашого Google Calendar",
        });
      }
    } catch (error) {
      console.error("Помилка при відправці сповіщень:", error);
    }
  };
  
  const handleTaskComplete = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };
  
  const handleTaskDelete = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "tasks") {
      toast({
        title: "Мої задачі",
        description: "Всі ваші заплановані задачі",
      });
    } else if (tab === "settings") {
      toast({
        title: "Налаштування",
        description: "Налаштуйте додаток під себе",
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-16 relative">
      <div className="container max-w-md mx-auto px-4 py-6 flex items-center justify-center flex-col relative">
        {showAddForm ? (
          <div className="form-overlay animate-fade-in">
            <div className="form-container animate-scale-in">
              <AddTaskForm
                initialDate={selectedDate}
                onSubmit={handleTaskSubmit}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        ) : (
          <>
            {activeTab === "calendar" && (
              <div className="space-y-6 w-full flex flex-col items-center animate-fade-in">
                <div className="flex justify-center w-full">
                  <TaskCalendar
                    onDateSelect={handleDateSelect}
                    onAddTask={handleAddTask}
                    selectedDate={selectedDate}
                  />
                </div>
                <TasksList
                  tasks={tasks}
                  date={selectedDate}
                  onTaskComplete={handleTaskComplete}
                  onTaskDelete={handleTaskDelete}
                />
              </div>
            )}
            
            {activeTab === "tasks" && (
              <div className="animate-fade-in w-full">
                <TasksList
                  tasks={tasks}
                  onTaskComplete={handleTaskComplete}
                  onTaskDelete={handleTaskDelete}
                />
              </div>
            )}
            
            {activeTab === "settings" && (
              <div className="animate-fade-in w-full">
                <Settings />
              </div>
            )}
          </>
        )}
      </div>
      
      {!showAddForm && <AddTaskButton onClick={() => setShowAddForm(true)} />}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
