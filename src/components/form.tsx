// Petits champs de formulaire natifs, stylés comme shadcn (robustes et accessibles).
import { cn } from "@/lib/utils";

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(fieldClass, "pr-8", className)} {...props} />;
}

export function DateInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return <input type="date" className={cn(fieldClass, className)} {...props} />;
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
