
import { Plus } from "lucide-react";

interface AddTaskButtonProps {
  onClick: () => void;
}

export function AddTaskButton({ onClick }: AddTaskButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed right-5 bottom-20 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.7)] z-10 animate-float transition-transform hover:scale-105 active:scale-95"
      aria-label="Додати нову задачу"
    >
      <Plus className="h-7 w-7 text-primary-foreground" />
    </button>
  );
}
