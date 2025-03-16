import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddTaskButtonProps {
  onClick: () => void;
}

export function AddTaskButton({ onClick }: AddTaskButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg md:bottom-8"
      size="icon"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
