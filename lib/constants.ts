// Date format constant for consistency across the application
// Format: YYYY-MM-DD (ISO 8601 date format)
// This format works with HTML date input and maintains consistency in Excel

export const DATE_FORMAT = "YYYY-MM-DD";

/**
 * Formats a Date object to YYYY-MM-DD string
 * @param date - Date object to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Gets current date in YYYY-MM-DD format
 * @returns Current date string in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return formatDate(new Date());
}

/**
 * Normalizes date string to YYYY-MM-DD format
 * Handles various input formats including DD.MM.YYYY and YYYY-MM-DD
 * @param dateStr - Date string to normalize
 * @returns Normalized date string in YYYY-MM-DD format
 */
export function normalizeDateString(dateStr: string): string {
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Handle DD.MM.YYYY format (e.g., 20.11.2025)
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split(".");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Handle DD/MM/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try to parse as Date object
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return formatDate(date);
    }
  } catch {
    // If all else fails, return original
  }

  return dateStr;
}
