import { addWeeks, addMonths, addQuarters, addYears, formatISO } from "date-fns";

export type Frequency = "weekly" | "monthly" | "quarterly" | "annually";

export function computeNextRunDate(from: string, frequency: Frequency, intervalCount: number) {
  const date = new Date(from + "T00:00:00");
  let next: Date;
  switch (frequency) {
    case "weekly":
      next = addWeeks(date, intervalCount);
      break;
    case "monthly":
      next = addMonths(date, intervalCount);
      break;
    case "quarterly":
      next = addQuarters(date, intervalCount);
      break;
    case "annually":
      next = addYears(date, intervalCount);
      break;
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
  return formatISO(next, { representation: "date" });
}
