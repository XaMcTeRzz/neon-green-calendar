
import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Виконано: {completed}/{total}</span>
        <span className="font-medium text-primary">{percentage}%</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2 bg-secondary" 
      />
    </div>
  );
}
