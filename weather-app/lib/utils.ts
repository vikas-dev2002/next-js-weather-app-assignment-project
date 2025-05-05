import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWeatherIconUrl(iconCode: string) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
}
