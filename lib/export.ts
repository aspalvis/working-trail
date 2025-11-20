import * as XLSX from "xlsx";
import { getProjectEntries, getProjects, initializeExcelFile } from "./database";

/**
 * Export project data to XLSX with advanced features:
 * - Multiple sheets (Time Entries, Summary, Analytics)
 * - Formulas for calculations
 * - Formatting and column widths
 * - Sortable columns
 */
export function exportProjectDataXLSX(projectName: string): Buffer {
  initializeExcelFile();

  const entries = getProjectEntries(projectName);
  if (entries.length === 0) {
    throw new Error("No entries found for this project");
  }

  const workbook = XLSX.utils.book_new();
  const hourlyRate = entries[0]?.hourlyRate || 0;

  // Sheet 1: Time Entries with formulas
  const timeEntriesData: any[][] = [
    ["Дата", "Время начала", "Время окончания", "Длительность (ч)", "Стоимость (€)"],
  ];

  // Add data rows with formulas for cost calculation
  entries.forEach((entry, index) => {
    const rowNum = index + 2; // Excel row number (1-based, +1 for header)
    timeEntriesData.push([
      entry.date,
      entry.startTime,
      entry.endTime,
      entry.duration,
      { f: `D${rowNum}*${hourlyRate}` }, // Formula: Duration * Rate
    ]);
  });

  // Add totals row with formulas
  const lastDataRow = entries.length + 1;
  const totalRow = lastDataRow + 1;
  timeEntriesData.push([
    "ИТОГО",
    "",
    "",
    { f: `SUM(D2:D${lastDataRow})` }, // Total hours
    { f: `SUM(E2:E${lastDataRow})` }, // Total cost
  ]);

  const timeEntriesSheet = XLSX.utils.aoa_to_sheet(timeEntriesData);

  // Set column widths
  timeEntriesSheet["!cols"] = [
    { wch: 12 }, // Date
    { wch: 12 }, // Start Time
    { wch: 12 }, // End Time
    { wch: 16 }, // Duration
    { wch: 14 }, // Cost
  ];

  // Add autofilter for sorting
  timeEntriesSheet["!autofilter"] = { ref: `A1:E${lastDataRow}` };

  XLSX.utils.book_append_sheet(workbook, timeEntriesSheet, "Записи времени");

  // Sheet 2: Summary with statistics
  const totalHours = entries.reduce((sum, e) => sum + e.duration, 0);
  const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
  const avgHoursPerDay =
    entries.length > 0 ? totalHours / new Set(entries.map((e) => e.date)).size : 0;

  const summaryData: any[][] = [
    ["Сводка по проекту", ""],
    ["", ""],
    ["Показатель", "Значение"],
    ["Название проекта", projectName],
    ["Почасовая ставка (€/ч)", hourlyRate],
    ["", ""],
    ["Всего записей", entries.length],
    ["Всего часов", { f: `'Записи времени'!D${totalRow}` }], // Reference to Time Entries total
    ["Общая стоимость (€)", { f: `'Записи времени'!E${totalRow}` }], // Reference to Time Entries total
    ["", ""],
    ["Период работы", ""],
    [
      "Начало",
      entries.length > 0 ? entries[entries.length - 1].date : "-",
    ],
    ["Конец", entries.length > 0 ? entries[0].date : "-"],
    ["", ""],
    ["Статистика", ""],
    [
      "Уникальных дней",
      new Set(entries.map((e) => e.date)).size,
    ],
    ["Среднее часов/день", parseFloat(avgHoursPerDay.toFixed(2))],
    [
      "Мин. запись (ч)",
      entries.length > 0 ? Math.min(...entries.map((e) => e.duration)) : 0,
    ],
    [
      "Макс. запись (ч)",
      entries.length > 0 ? Math.max(...entries.map((e) => e.duration)) : 0,
    ],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 25 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Сводка");

  // Sheet 3: Analytics by Date
  const dateMap = new Map<string, { hours: number; cost: number; count: number }>();
  entries.forEach((entry) => {
    const existing = dateMap.get(entry.date) || { hours: 0, cost: 0, count: 0 };
    existing.hours += entry.duration;
    existing.cost += entry.cost;
    existing.count += 1;
    dateMap.set(entry.date, existing);
  });

  const analyticsData: any[][] = [
    ["Дата", "Записей", "Часов", "Стоимость (€)", "% от общего времени", "% от общей стоимости"],
  ];

  const sortedDates = Array.from(dateMap.entries()).sort(([a], [b]) => b.localeCompare(a));

  sortedDates.forEach(([date, stats], index) => {
    const rowNum = index + 2;
    analyticsData.push([
      date,
      stats.count,
      stats.hours,
      stats.cost,
      { f: `C${rowNum}/${totalHours}` }, // % of total hours
      { f: `D${rowNum}/${totalCost}` }, // % of total cost
    ]);
  });

  // Add totals row
  const lastAnalyticsRow = sortedDates.length + 1;
  const totalAnalyticsRow = lastAnalyticsRow + 1;
  analyticsData.push([
    "ИТОГО",
    { f: `SUM(B2:B${lastAnalyticsRow})` },
    { f: `SUM(C2:C${lastAnalyticsRow})` },
    { f: `SUM(D2:D${lastAnalyticsRow})` },
    { f: `SUM(E2:E${lastAnalyticsRow})` },
    { f: `SUM(F2:F${lastAnalyticsRow})` },
  ]);

  const analyticsSheet = XLSX.utils.aoa_to_sheet(analyticsData);
  analyticsSheet["!cols"] = [
    { wch: 12 }, // Date
    { wch: 10 }, // Count
    { wch: 10 }, // Hours
    { wch: 14 }, // Cost
    { wch: 18 }, // % Hours
    { wch: 20 }, // % Cost
  ];

  // Add autofilter
  analyticsSheet["!autofilter"] = { ref: `A1:F${lastAnalyticsRow}` };

  XLSX.utils.book_append_sheet(workbook, analyticsSheet, "Аналитика по датам");

  // Write to buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

/**
 * Export all projects summary to XLSX
 */
export function exportAllProjectsXLSX(): Buffer {
  initializeExcelFile();

  const projects = getProjects();
  const workbook = XLSX.utils.book_new();

  // Collect data for all projects
  const projectsData: any[][] = [
    ["Проект", "Ставка (€/ч)", "Всего часов", "Общая стоимость (€)", "Записей", "% от общих часов", "% от общей стоимости"],
  ];

  let totalHours = 0;
  let totalCost = 0;

  const projectStats = projects.map((project) => {
    const entries = getProjectEntries(project.name);
    const hours = entries.reduce((sum, e) => sum + e.duration, 0);
    const cost = entries.reduce((sum, e) => sum + e.cost, 0);
    totalHours += hours;
    totalCost += cost;
    return {
      name: project.name,
      rate: project.hourlyRate,
      hours,
      cost,
      count: entries.length,
    };
  });

  projectStats.forEach((stat, index) => {
    const rowNum = index + 2;
    projectsData.push([
      stat.name,
      stat.rate,
      stat.hours,
      stat.cost,
      stat.count,
      totalHours > 0 ? { f: `C${rowNum}/${totalHours}` } : 0, // % of total hours
      totalCost > 0 ? { f: `D${rowNum}/${totalCost}` } : 0, // % of total cost
    ]);
  });

  // Add totals row
  const lastRow = projectStats.length + 1;
  const totalRowNum = lastRow + 1;
  projectsData.push([
    "ИТОГО",
    "",
    { f: `SUM(C2:C${lastRow})` },
    { f: `SUM(D2:D${lastRow})` },
    { f: `SUM(E2:E${lastRow})` },
    { f: `SUM(F2:F${lastRow})` },
    { f: `SUM(G2:G${lastRow})` },
  ]);

  const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
  projectsSheet["!cols"] = [
    { wch: 25 }, // Project name
    { wch: 14 }, // Rate
    { wch: 14 }, // Hours
    { wch: 18 }, // Cost
    { wch: 10 }, // Count
    { wch: 18 }, // % Hours
    { wch: 20 }, // % Cost
  ];

  // Add autofilter
  projectsSheet["!autofilter"] = { ref: `A1:G${lastRow}` };

  XLSX.utils.book_append_sheet(workbook, projectsSheet, "Все проекты");

  // Add individual sheets for each project with entries
  projectStats.forEach((stat) => {
    if (stat.count === 0) return; // Skip projects without entries

    const entries = getProjectEntries(stat.name);
    const sheetData: any[][] = [
      ["Дата", "Начало", "Окончание", "Часов", "Стоимость (€)"],
    ];

    entries.forEach((entry) => {
      sheetData.push([
        entry.date,
        entry.startTime,
        entry.endTime,
        entry.duration,
        entry.cost,
      ]);
    });

    // Add totals
    const lastEntryRow = entries.length + 1;
    sheetData.push([
      "ИТОГО",
      "",
      "",
      { f: `SUM(D2:D${lastEntryRow})` },
      { f: `SUM(E2:E${lastEntryRow})` },
    ]);

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    sheet["!cols"] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
    ];
    sheet["!autofilter"] = { ref: `A1:E${lastEntryRow}` };

    // Truncate project name if too long for sheet name (max 31 chars)
    const sheetName = stat.name.length > 31 ? stat.name.substring(0, 31) : stat.name;
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  });

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}
