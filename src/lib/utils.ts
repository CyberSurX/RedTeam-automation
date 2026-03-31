/**
 * Utility function for conditionally combining classNames
 * Similar to the 'clsx' pattern used in shadcn/ui components
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
