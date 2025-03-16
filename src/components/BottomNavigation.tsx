
import { Calendar, ListTodo, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    {
      id: "calendar",
      label: "Календар",
      icon: Calendar,
    },
    {
      id: "tasks",
      label: "Мої задачі",
      icon: ListTodo,
    },
    {
      id: "settings",
      label: "Налаштування",
      icon: Settings,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-card border-t border-neon-green/20 backdrop-blur-lg">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              "flex flex-col items-center py-3 px-5 transition-colors",
              activeTab === tab.id
                ? "text-neon-green"
                : "text-muted-foreground hover:text-primary"
            )}
            onClick={() => onTabChange(tab.id)}
          >
            <tab.icon className={cn(
              "h-6 w-6 mb-1 transition-all",
              activeTab === tab.id ? "animate-glow" : ""
            )} />
            <span className="text-xs font-medium">{tab.label}</span>
            {activeTab === tab.id && (
              <span className="absolute bottom-1 h-1 w-10 bg-neon-green rounded-full animate-pulse-neon" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
