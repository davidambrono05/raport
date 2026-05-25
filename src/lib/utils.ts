export type ClassValue = string | number | boolean | undefined | null | ClassValue[];

export function clsx(...inputs: ClassValue[]): string {
  const result: string[] = [];
  for (const item of inputs) {
    if (!item && item !== 0) continue;
    if (typeof item === 'string' || typeof item === 'number') {
      result.push(String(item));
    } else if (Array.isArray(item)) {
      const inner = clsx(...item);
      if (inner) result.push(inner);
    }
  }
  return result.join(' ');
}

export function twMerge(...inputs: ClassValue[]): string {
  return clsx(...inputs);
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(...inputs);
}
