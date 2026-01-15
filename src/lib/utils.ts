import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  if (!inputs || inputs.length === 0) {
    return "";
  }

  try {
    const classNames = clsx(inputs);
    
    if (typeof classNames !== "string") {
      return "";
    }

    return twMerge(classNames);
  } catch (error) {
    console.error("Error merging class names:", error);
    return "";
  }
}