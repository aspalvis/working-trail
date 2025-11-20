import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

const MAIN_SHEET_NAME = "Общий";
const TIMERS_SHEET_NAME = "_timers";
const PROJECT_META_SHEET_NAME = "_projectMeta"; // legacy
const SETTINGS_SHEET_NAME = "_settings"; // key-value store
const ANALYTICS_SHEET_NAME = "Аналитика"; // summary/analytics sheet

export interface TimeEntry {
  date: string;
  project: string;
  duration: number;
  startTime: string;
  endTime: string;
}

export interface Timer {
  timerId: string;
  project: string;
  startTime: string;
  elapsedTime: number;
  isRunning: boolean;
}

function getDataDirectory(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function getExcelFilePath(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const fileName = `time-tracking-${year}-${month}.xlsx`;
  const dataDir = getDataDirectory();
  return path.join(dataDir, fileName);
}

function writeWorkbook(workbook: XLSX.WorkBook, filePath: string) {
  try {
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, buffer);
  } catch (error: any) {
    if (error.code === "EBUSY" || error.code === "EPERM") {
      throw new Error("Файл Excel открыт в другой программе. Закройте файл и попробуйте снова.");
    }
    throw error;
  }
}

function readWorkbook(filePath: string): XLSX.WorkBook {
  try {
    const buffer = fs.readFileSync(filePath);
    return XLSX.read(buffer, { type: "buffer" });
  } catch (error: any) {
    if (error.code === "EBUSY" || error.code === "EPERM") {
      throw new Error("Файл Excel открыт в другой программе. Закройте файл и попробуйте снова.");
    }
    if (error.code === "ENOENT") {
      throw new Error("Файл Excel не найден.");
    }
    throw error;
  }
}

function ensureSettingsSheet(workbook: XLSX.WorkBook) {
  if (!workbook.SheetNames.includes(SETTINGS_SHEET_NAME)) {
    const sheet = XLSX.utils.aoa_to_sheet([["Key", "Value"]]);
    XLSX.utils.book_append_sheet(workbook, sheet, SETTINGS_SHEET_NAME);
    return;
  }
  const sheet = workbook.Sheets[SETTINGS_SHEET_NAME];
  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (data.length === 0) {
    workbook.Sheets[SETTINGS_SHEET_NAME] = XLSX.utils.aoa_to_sheet([["Key", "Value"]]);
    return;
  }
  const header = data[0];
  // migrate old format Project/HourlyRateEUR
  if (header[0] === "Project" && header[1] === "HourlyRateEUR") {
    const newData: any[][] = [["Key", "Value"]];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) {
        newData.push([`project:${row[0]}:hourlyRateEUR`, row[1]]);
      }
    }
    workbook.Sheets[SETTINGS_SHEET_NAME] = XLSX.utils.aoa_to_sheet(newData);
  }
}

function migrateFromLegacyProjectMeta(workbook: XLSX.WorkBook) {
  if (!workbook.SheetNames.includes(PROJECT_META_SHEET_NAME)) return;
  const metaSheet = workbook.Sheets[PROJECT_META_SHEET_NAME];
  const metaData: any[][] = XLSX.utils.sheet_to_json(metaSheet, { header: 1 });
  if (metaData.length <= 1) return;
  const settingsSheet = workbook.Sheets[SETTINGS_SHEET_NAME];
  const settingsData: any[][] = XLSX.utils.sheet_to_json(settingsSheet, { header: 1 });
  // only migrate if settings currently empty (only header)
  if (settingsData.length === 1) {
    for (let i = 1; i < metaData.length; i++) {
      const row = metaData[i];
      if (row[0]) {
        settingsData.push([`project:${row[0]}:hourlyRateEUR`, row[1]]);
      }
    }
    workbook.Sheets[SETTINGS_SHEET_NAME] = XLSX.utils.aoa_to_sheet(settingsData);
  }
}

export function initializeExcelFile() {
  try {
    const excelFilePath = getExcelFilePath();
    if (!fs.existsSync(excelFilePath)) {
      const workbook = XLSX.utils.book_new();
      // Main sheet
      const mainSheet = XLSX.utils.aoa_to_sheet([["Дата", "Общее время (ч)"]]);
      XLSX.utils.book_append_sheet(workbook, mainSheet, MAIN_SHEET_NAME);
      // Timers sheet
      const timersSheet = XLSX.utils.aoa_to_sheet([
        ["TimerID", "Project", "StartTime", "ElapsedTime", "IsRunning"],
      ]);
      XLSX.utils.book_append_sheet(workbook, timersSheet, TIMERS_SHEET_NAME);
      // Settings sheet (KV)
      const settingsSheet = XLSX.utils.aoa_to_sheet([["Key", "Value"]]);
      XLSX.utils.book_append_sheet(workbook, settingsSheet, SETTINGS_SHEET_NAME);
      writeWorkbook(workbook, excelFilePath);
      return;
    }
    const workbook = readWorkbook(excelFilePath);
    // ensure timers sheet
    if (!workbook.SheetNames.includes(TIMERS_SHEET_NAME)) {
      const timersSheet = XLSX.utils.aoa_to_sheet([
        ["TimerID", "Project", "StartTime", "ElapsedTime", "IsRunning"],
      ]);
      XLSX.utils.book_append_sheet(workbook, timersSheet, TIMERS_SHEET_NAME);
    }
    ensureSettingsSheet(workbook);
    migrateFromLegacyProjectMeta(workbook);
    rebuildAnalyticsSheet(workbook);
    writeWorkbook(workbook, excelFilePath);
  } catch (error) {
    console.error("Error initializing Excel file:", error);
    throw new Error("Не удалось создать файл Excel. Проверьте права доступа к папке data.");
  }
}

export interface ProjectWithRate {
  name: string;
  hourlyRate: number;
}

function getSetting(workbook: XLSX.WorkBook, key: string): string | undefined {
  const sheet = workbook.Sheets[SETTINGS_SHEET_NAME];
  if (!sheet) return undefined;
  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === key) return row[1];
  }
  return undefined;
}

function setSetting(workbook: XLSX.WorkBook, key: string, value: string | number) {
  ensureSettingsSheet(workbook);
  const sheet = workbook.Sheets[SETTINGS_SHEET_NAME];
  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (data.length === 0) data.push(["Key", "Value"]);
  const idx = data.findIndex((row, i) => i > 0 && row[0] === key);
  if (idx !== -1) {
    data[idx][1] = value;
  } else {
    data.push([key, value]);
  }
  workbook.Sheets[SETTINGS_SHEET_NAME] = XLSX.utils.aoa_to_sheet(data);
  // when settings change, regenerate analytics if present
  rebuildAnalyticsSheet(workbook);
}

function getHourlyRate(projectName: string, workbook: XLSX.WorkBook): number {
  const v = getSetting(workbook, `project:${projectName}:hourlyRateEUR`);
  const n = parseFloat(v || "0");
  return isNaN(n) ? 0 : n;
}

export function getProjects(): ProjectWithRate[] {
  initializeExcelFile();
  const excelFilePath = getExcelFilePath();
  const workbook = readWorkbook(excelFilePath);
  const projectNames = workbook.SheetNames.filter(
    (name) => name !== MAIN_SHEET_NAME && !name.startsWith("_")
  );
  return projectNames.map((name) => ({ name, hourlyRate: getHourlyRate(name, workbook) }));
}

export function addProject(projectName: string, hourlyRate: number = 0) {
  try {
    initializeExcelFile();
    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);
    if (workbook.SheetNames.includes(projectName)) {
      throw new Error("Проект уже существует");
    }
    const projectSheet = XLSX.utils.aoa_to_sheet([
      ["Дата", "Время начала", "Время окончания", "Длительность (ч)", "Описание", "Стоимость (€)"],
    ]);
    XLSX.utils.book_append_sheet(workbook, projectSheet, projectName);
    // update main sheet header
    const mainSheet = workbook.Sheets[MAIN_SHEET_NAME];
    const mainData: any[][] = XLSX.utils.sheet_to_json(mainSheet, { header: 1 });
    if (mainData.length === 0) {
      mainData.push(["Дата", "Общее время (ч)", projectName]);
    } else if (!mainData[0].includes(projectName)) {
      mainData[0].push(projectName);
    }
    workbook.Sheets[MAIN_SHEET_NAME] = XLSX.utils.aoa_to_sheet(mainData);
    setSetting(workbook, `project:${projectName}:hourlyRateEUR`, hourlyRate);
    rebuildAnalyticsSheet(workbook);
    writeWorkbook(workbook, excelFilePath);
  } catch (error: any) {
    console.error("Error adding project:", error);
    if (error.message === "Проект уже существует") throw error;
    throw new Error("Не удалось добавить проект. Проверьте права доступа к папке data.");
  }
}

export function updateProjectRate(projectName: string, hourlyRate: number) {
  try {
    initializeExcelFile();
    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);
    setSetting(workbook, `project:${projectName}:hourlyRateEUR`, hourlyRate);
    rebuildAnalyticsSheet(workbook);
    writeWorkbook(workbook, excelFilePath);
  } catch (error) {
    console.error("Error updating project rate:", error);
    throw new Error("Не удалось обновить ставку проекта.");
  }
}

export function saveTimeEntry(entry: TimeEntry) {
  try {
    initializeExcelFile();
    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);
    if (!workbook.SheetNames.includes(entry.project)) {
      addProject(entry.project); // default rate 0
      return saveTimeEntry(entry);
    }
    const sheet = workbook.Sheets[entry.project];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (data.length > 0) {
      const header = data[0];
      if (!header.includes("Стоимость (€)")) {
        const oldIdx = header.indexOf("Стоимость");
        if (oldIdx !== -1) header[oldIdx] = "Стоимость (€)";
        else header.push("Стоимость (€)");
      }
    }
    const hourlyRate = getHourlyRate(entry.project, workbook);
    const cost = parseFloat((entry.duration * hourlyRate).toFixed(2));
    data.push([entry.date, entry.startTime, entry.endTime, entry.duration, "", cost]);
    workbook.Sheets[entry.project] = XLSX.utils.aoa_to_sheet(data);
    updateMainSheet(workbook, entry.project, entry.date, entry.duration);
    rebuildAnalyticsSheet(workbook);
    writeWorkbook(workbook, excelFilePath);
  } catch (error) {
    console.error("Error saving time entry:", error);
    throw new Error(
      "Не удалось сохранить запись времени. Убедитесь, что файл Excel не открыт в другой программе."
    );
  }
}

function updateMainSheet(workbook: XLSX.WorkBook, project: string, date: string, duration: number) {
  const sheet = workbook.Sheets[MAIN_SHEET_NAME];
  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (data.length === 0) {
    data.push(["Дата", "Общее время (ч)", project]);
  }
  const header = data[0];
  if (!header.includes(project)) header.push(project);
  const projectIndex = header.indexOf(project);
  let rowIndex = data.findIndex((row, i) => i > 0 && row[0] === date);
  if (rowIndex !== -1) {
    const row = data[rowIndex];
    const current = parseFloat(row[projectIndex] || "0");
    row[projectIndex] = current + duration;
    // recalc total (col 1)
    const total = header.slice(2).reduce((sum, _, idx) => sum + parseFloat(row[idx + 2] || "0"), 0);
    row[1] = total;
  } else {
    const newRow: any[] = new Array(header.length).fill(0);
    newRow[0] = date;
    newRow[projectIndex] = duration;
    // total equals duration for this new date
    newRow[1] = duration;
    data.push(newRow);
  }
  workbook.Sheets[MAIN_SHEET_NAME] = XLSX.utils.aoa_to_sheet(data);
  // do not rebuild analytics here to avoid multiple calls in a single save; caller handles
}

export interface TimeEntryWithCost extends TimeEntry {
  cost: number;
  hourlyRate: number;
}

export function getProjectEntries(projectName: string): TimeEntryWithCost[] {
  initializeExcelFile();
  const excelFilePath = getExcelFilePath();
  const workbook = readWorkbook(excelFilePath);
  if (!workbook.SheetNames.includes(projectName)) return [];
  const sheet = workbook.Sheets[projectName];
  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const hourlyRate = getHourlyRate(projectName, workbook);
  const header = data[0] || [];
  let costIndex = header.indexOf("Стоимость (€)");
  if (costIndex === -1) costIndex = header.indexOf("Стоимость");
  return data.slice(1).map((row) => {
    const duration = parseFloat(row[3] || "0");
    const cost =
      costIndex !== -1
        ? parseFloat(row[costIndex] || "0")
        : parseFloat((duration * hourlyRate).toFixed(2));
    return {
      date: row[0] || "",
      startTime: row[1] || "",
      endTime: row[2] || "",
      duration,
      project: projectName,
      cost,
      hourlyRate,
    };
  });
}

export function getActiveTimers(): Timer[] {
  initializeExcelFile();
  const excelFilePath = getExcelFilePath();
  const workbook = readWorkbook(excelFilePath);
  if (!workbook.SheetNames.includes(TIMERS_SHEET_NAME)) return [];
  const sheet = workbook.Sheets[TIMERS_SHEET_NAME];
  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  return data.slice(1).map((row) => ({
    timerId: row[0] || "",
    project: row[1] || "",
    startTime: row[2] || "",
    elapsedTime: parseFloat(row[3] || "0"),
    isRunning: row[4] === true || row[4] === "true",
  }));
}

export function getTimer(timerId: string): Timer | null {
  const timers = getActiveTimers();
  return timers.find((t) => t.timerId === timerId) || null;
}

export function startTimer(timerId: string, project: string): Timer {
  try {
    initializeExcelFile();
    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);
    const sheet = workbook.Sheets[TIMERS_SHEET_NAME];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const idx = data.findIndex((row, i) => i > 0 && row[0] === timerId);
    const timer: Timer = {
      timerId,
      project,
      startTime: new Date().toISOString(),
      elapsedTime: 0,
      isRunning: true,
    };
    if (idx !== -1) {
      data[idx] = [
        timer.timerId,
        timer.project,
        timer.startTime,
        timer.elapsedTime,
        timer.isRunning,
      ];
    } else {
      data.push([
        timer.timerId,
        timer.project,
        timer.startTime,
        timer.elapsedTime,
        timer.isRunning,
      ]);
    }
    workbook.Sheets[TIMERS_SHEET_NAME] = XLSX.utils.aoa_to_sheet(data);
    writeWorkbook(workbook, excelFilePath);
    return timer;
  } catch (error) {
    console.error("Error starting timer:", error);
    throw new Error("Не удалось запустить таймер.");
  }
}

export function updateTimer(timerId: string, elapsedTime: number): Timer | null {
  try {
    initializeExcelFile();
    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);
    const sheet = workbook.Sheets[TIMERS_SHEET_NAME];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const idx = data.findIndex((row, i) => i > 0 && row[0] === timerId);
    if (idx === -1) return null;
    data[idx][3] = elapsedTime;
    workbook.Sheets[TIMERS_SHEET_NAME] = XLSX.utils.aoa_to_sheet(data);
    writeWorkbook(workbook, excelFilePath);
    return {
      timerId: data[idx][0],
      project: data[idx][1],
      startTime: data[idx][2],
      elapsedTime: data[idx][3],
      isRunning: data[idx][4] === true || data[idx][4] === "true",
    };
  } catch (error) {
    console.error("Error updating timer:", error);
    throw new Error("Не удалось обновить таймер.");
  }
}

export function stopTimer(timerId: string): Timer | null {
  try {
    initializeExcelFile();
    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);
    const sheet = workbook.Sheets[TIMERS_SHEET_NAME];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const idx = data.findIndex((row, i) => i > 0 && row[0] === timerId);
    if (idx === -1) return null;
    data[idx][4] = false;
    workbook.Sheets[TIMERS_SHEET_NAME] = XLSX.utils.aoa_to_sheet(data);
    writeWorkbook(workbook, excelFilePath);
    return {
      timerId: data[idx][0],
      project: data[idx][1],
      startTime: data[idx][2],
      elapsedTime: data[idx][3],
      isRunning: false,
    };
  } catch (error) {
    console.error("Error stopping timer:", error);
    throw new Error("Не удалось остановить таймер.");
  }
}

export function deleteTimer(timerId: string): boolean {
  try {
    initializeExcelFile();
    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);
    const sheet = workbook.Sheets[TIMERS_SHEET_NAME];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const idx = data.findIndex((row, i) => i > 0 && row[0] === timerId);
    if (idx === -1) return false;
    data.splice(idx, 1);
    workbook.Sheets[TIMERS_SHEET_NAME] = XLSX.utils.aoa_to_sheet(data);
    writeWorkbook(workbook, excelFilePath);
    return true;
  } catch (error) {
    console.error("Error deleting timer:", error);
    throw new Error("Не удалось удалить таймер.");
  }
}

// Generic external accessors (optional usage)
export function getSettingValue(key: string): string | undefined {
  initializeExcelFile();
  const workbook = readWorkbook(getExcelFilePath());
  return getSetting(workbook, key);
}

export function setSettingValue(key: string, value: string | number): void {
  initializeExcelFile();
  const file = getExcelFilePath();
  const workbook = readWorkbook(file);
  setSetting(workbook, key, value);
  rebuildAnalyticsSheet(workbook);
  writeWorkbook(workbook, file);
}

// Build analytics sheet with formulas (hours, cost, percentages)
function rebuildAnalyticsSheet(workbook: XLSX.WorkBook) {
  // collect project names
  const projectNames = workbook.SheetNames.filter(
    (name) => name !== MAIN_SHEET_NAME && !name.startsWith("_") && name !== ANALYTICS_SHEET_NAME
  );
  const rows: any[][] = [
    ["Проект", "Часы (SUM)", "Ставка (€/ч)", "Стоимость (€)", "% Часы", "% Стоимость"],
  ];
  // placeholder rows; formulas added after we know total row index
  for (let i = 0; i < projectNames.length; i++) {
    const project = projectNames[i];
    const rate = getHourlyRate(project, workbook);
    const rowIndexExcel = i + 2; // Excel row number (1-based) for this project
    // Hours formula: SUM of Duration column (column D) in project sheet
    const hoursFormula = `SUM('${project}'!D:D)`;
    // Cost formula: Hours * Rate (rounded)
    const costFormula = `ROUND(B${rowIndexExcel}*C${rowIndexExcel},2)`;
    rows.push([project, { f: hoursFormula }, rate, { f: costFormula }, "", ""]);
  }
  const totalRowIndexExcel = projectNames.length + 2;
  if (projectNames.length > 0) {
    // add percentages formulas now that total row index is known
    for (let i = 0; i < projectNames.length; i++) {
      const excelRow = i + 2;
      // % Hours
      (rows[i + 1][4] as any) = {
        f: `IF(SUM(B2:B${totalRowIndexExcel - 1})=0,0,B${excelRow}/SUM(B2:B${
          totalRowIndexExcel - 1
        }))`,
      };
      // % Cost
      (rows[i + 1][5] as any) = {
        f: `IF(SUM(D2:D${totalRowIndexExcel - 1})=0,0,D${excelRow}/SUM(D2:D${
          totalRowIndexExcel - 1
        }))`,
      };
    }
  }
  // Totals row
  rows.push([
    "ИТОГО",
    { f: `SUM(B2:B${totalRowIndexExcel - 1})` },
    "",
    { f: `SUM(D2:D${totalRowIndexExcel - 1})` },
    "",
    "",
  ]);
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  // Column widths for readability
  (sheet as any)["!cols"] = [
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 12 },
  ];
  // Replace or append sheet
  if (workbook.SheetNames.includes(ANALYTICS_SHEET_NAME)) {
    workbook.Sheets[ANALYTICS_SHEET_NAME] = sheet;
  } else {
    XLSX.utils.book_append_sheet(workbook, sheet, ANALYTICS_SHEET_NAME);
  }
}
