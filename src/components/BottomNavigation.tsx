import { Calendar, ListTodo, Settings as SettingsIcon } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around z-10 md:hidden">
      <button
        onClick={() => onTabChange("calendar")}
        className={`flex flex-col items-center justify-center w-20 h-full transition-colors ${
          activeTab === "calendar" ? "text-neon-green" : "text-muted-foreground"
        }`}
      >
        <Calendar className="h-5 w-5" />
        <span className="text-xs mt-1">Календар</span>
      </button>
      
      <button
        onClick={() => onTabChange("tasks")}
        className={`flex flex-col items-center justify-center w-20 h-full transition-colors ${
          activeTab === "tasks" ? "text-neon-green" : "text-muted-foreground"
        }`}
      >
        <ListTodo className="h-5 w-5" />
        <span className="text-xs mt-1">Задачі та примітки</span>
      </button>
      
      <button
        onClick={() => onTabChange("settings")}
        className={`flex flex-col items-center justify-center w-20 h-full transition-colors ${
          activeTab === "settings" ? "text-neon-green" : "text-muted-foreground"
        }`}
      >
        <SettingsIcon className="h-5 w-5" />
        <span className="text-xs mt-1">Налаштування</span>
      </button>
    </div>
  );
}
