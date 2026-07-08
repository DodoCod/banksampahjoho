import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color?: "green" | "yellow" | "blue" | "purple";
  className?: string;
}

const colorStyles = {
  green: {
    icon: "bg-brand-100 text-brand-700",
    accent: "border-l-brand-500",
  },
  yellow: {
    icon: "bg-earth-100 text-earth-700",
    accent: "border-l-earth-500",
  },
  blue: {
    icon: "bg-blue-100 text-blue-700",
    accent: "border-l-blue-500",
  },
  purple: {
    icon: "bg-purple-100 text-purple-700",
    accent: "border-l-purple-500",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "green",
  className,
}: StatCardProps) {
  const styles = colorStyles[color];
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm",
        "border-l-4",
        styles.accent,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <p className="mt-1 truncate text-xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={cn("flex-shrink-0 rounded-lg p-2", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
