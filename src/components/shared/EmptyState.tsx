import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center py-12 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-[260px] text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5 h-11 rounded-xl bg-accent px-6 font-semibold text-accent-foreground">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
