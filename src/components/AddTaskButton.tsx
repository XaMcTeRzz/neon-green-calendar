import { Plus } from "lucide-react";

interface AddTaskButtonProps {
  onClick: () => void;
}

export function AddTaskButton({ onClick }: AddTaskButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed right-5 bottom-20 w-16 h-16 rounded-full bg-neon-green text-black flex items-center justify-center shadow-[0_0_25px_rgba(57,255,20,0.8)] z-20 animate-float transition-transform hover:scale-110 active:scale-95 focus:outline-none"
      aria-label="Додати нову задачу"
    >
      <Plus className="h-8 w-8" strokeWidth={3} />
    </button>
  );
}
