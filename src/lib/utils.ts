import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals: number = 2): string {
  if (num === undefined || num === null || isNaN(num)) return '0.00';
  return Number(num.toFixed(decimals)).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatPrice(num: number, decimals: number = 6): string {
  if (num === undefined || num === null || isNaN(num)) return '$0.00';
  
  // For very small numbers (less than 0.000001), use scientific notation
  if (num < 0.000001 && num > 0) {
    return `$${num.toExponential(2)}`;
  }
  
  // For regular numbers, use standard formatting with up to 6 decimal places
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: num < 0.01 ? 6 : 2,
    maximumFractionDigits: num < 0.01 ? 6 : 2
  }).format(num);
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}