import React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "destructive" | "outline" | "secondary";
};

export const Badge: React.FC<BadgeProps> = ({ className, children, variant = "default", ...props }) => {
  const variants: Record<string, string> = {
    default: "bg-gray-200 text-gray-800",
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white",
    destructive: "bg-red-500 text-white",
    outline: "border border-gray-200 text-gray-800",
    secondary: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium", variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;