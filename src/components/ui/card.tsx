import React from "react";
import { cn } from "@/lib/utils";

type BaseProps = React.HTMLAttributes<HTMLDivElement> & { className?: string };

export const Card: React.FC<BaseProps> = ({ className, children, ...props }) => (
  <div
    className={cn(
      "rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<BaseProps> = ({ className, children, ...props }) => (
  <div className={cn("p-4 border-b border-gray-200 dark:border-gray-800", className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<BaseProps> = ({ className, children, ...props }) => (
  <div className={cn("text-lg font-semibold", className)} {...props}>
    {children}
  </div>
);

export const CardDescription: React.FC<BaseProps> = ({ className, children, ...props }) => (
  <div className={cn("text-sm text-gray-500 dark:text-gray-400", className)} {...props}>
    {children}
  </div>
);

export const CardContent: React.FC<BaseProps> = ({ className, children, ...props }) => (
  <div className={cn("p-4", className)} {...props}>
    {children}
  </div>
);

export default Card;