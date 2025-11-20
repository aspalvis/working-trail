import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const MAIN_SHEET_NAME = 'Общий';
const TIMERS_SHEET_NAME = '_timers';

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
  const dataDir = path.join(process.cwd(), 'data');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return dataDir;
}

function getExcelFilePath(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const fileName = `time-tracking-${year}-${month}.xlsx`;
  const dataDir = getDataDirectory();
  return path.join(dataDir, fileName);
}

function writeWorkbook(workbook: XLSX.WorkBook, filePath: string) {
  try {
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, buffer);
  } catch (error: any) {
    if (error.code === 'EBUSY' || error.code === 'EPERM') {
      throw new Error('Файл Excel открыт в другой программе. Закройте файл и попробуйте снова.');
    }
    throw error;
  }
}

function readWorkbook(filePath: string): XLSX.WorkBook {
  try {
    const buffer = fs.readFileSync(filePath);
    return XLSX.read(buffer, { type: 'buffer' });
  } catch (error: any) {
    if (error.code === 'EBUSY' || error.code === 'EPERM') {
      throw new Error('Файл Excel открыт в другой программе. Закройте файл и попробуйте снова.');
    }
    if (error.code === 'ENOENT') {
      throw new Error('Файл Excel не найден.');
    }
    throw error;
  }
}

export function initializeExcelFile() {
  try {
    const excelFilePath = getExcelFilePath();

    if (!fs.existsSync(excelFilePath)) {
      const workbook = XLSX.utils.book_new();

      const mainSheetData = [
        ['Дата', 'Общее время (ч)']
      ];
      const mainSheet = XLSX.utils.aoa_to_sheet(mainSheetData);
      XLSX.utils.book_append_sheet(workbook, mainSheet, MAIN_SHEET_NAME);

      const timersSheetData = [
        ['TimerID', 'Project', 'StartTime', 'ElapsedTime', 'IsRunning']
      ];
      const timersSheet = XLSX.utils.aoa_to_sheet(timersSheetData);
      XLSX.utils.book_append_sheet(workbook, timersSheet, TIMERS_SHEET_NAME);

      writeWorkbook(workbook, excelFilePath);
    } else {
      const workbook = readWorkbook(excelFilePath);
      if (!workbook.SheetNames.includes(TIMERS_SHEET_NAME)) {
        const timersSheetData = [
          ['TimerID', 'Project', 'StartTime', 'ElapsedTime', 'IsRunning']
        ];
        const timersSheet = XLSX.utils.aoa_to_sheet(timersSheetData);
        XLSX.utils.book_append_sheet(workbook, timersSheet, TIMERS_SHEET_NAME);
        writeWorkbook(workbook, excelFilePath);
      }
    }
  } catch (error) {
    console.error('Error initializing Excel file:', error);
    throw new Error('Не удалось создать файл Excel. Проверьте права доступа к папке data.');
  }
}

export function getProjects(): string[] {
  initializeExcelFile();

  const excelFilePath = getExcelFilePath();
  const workbook = readWorkbook(excelFilePath);
  const projects = workbook.SheetNames.filter(name =>
    name !== MAIN_SHEET_NAME && !name.startsWith('_')
  );

  return projects;
}

export function addProject(projectName: string) {
  try {
    initializeExcelFile();

    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);

    if (workbook.SheetNames.includes(projectName)) {
      throw new Error('Проект уже существует');
    }

    const projectSheetData = [
      ['Дата', 'Время начала', 'Время окончания', 'Длительность (ч)', 'Описание']
    ];
    const projectSheet = XLSX.utils.aoa_to_sheet(projectSheetData);
    XLSX.utils.book_append_sheet(workbook, projectSheet, projectName);

    const mainSheet = workbook.Sheets[MAIN_SHEET_NAME];
    const mainData: any[][] = XLSX.utils.sheet_to_json(mainSheet, { header: 1 });

    if (mainData.length > 0) {
      mainData[0].push(projectName);
    }

    const newMainSheet = XLSX.utils.aoa_to_sheet(mainData);
    workbook.Sheets[MAIN_SHEET_NAME] = newMainSheet;

    writeWorkbook(workbook, excelFilePath);
  } catch (error: any) {
    console.error('Error adding project:', error);
    if (error.message === 'Проект уже существует') {
      throw error;
    }
    throw new Error('Не удалось добавить проект. Проверьте права доступа к папке data.');
  }
}

export function saveTimeEntry(entry: TimeEntry) {
  try {
    initializeExcelFile();

    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);

    if (!workbook.SheetNames.includes(entry.project)) {
      addProject(entry.project);
      return saveTimeEntry(entry);
    }

    const projectSheet = workbook.Sheets[entry.project];
    const projectData: any[][] = XLSX.utils.sheet_to_json(projectSheet, { header: 1 });

    projectData.push([
      entry.date,
      entry.startTime,
      entry.endTime,
      entry.duration,
      ''
    ]);

    const newProjectSheet = XLSX.utils.aoa_to_sheet(projectData);
    workbook.Sheets[entry.project] = newProjectSheet;

    updateMainSheet(workbook, entry.project, entry.date, entry.duration);

    writeWorkbook(workbook, excelFilePath);
  } catch (error) {
    console.error('Error saving time entry:', error);
    throw new Error('Не удалось сохранить запись времени. Убедитесь, что файл Excel не открыт в другой программе.');
  }
}

function updateMainSheet(workbook: XLSX.WorkBook, project: string, date: string, duration: number) {
  const mainSheet = workbook.Sheets[MAIN_SHEET_NAME];
  const mainData: any[][] = XLSX.utils.sheet_to_json(mainSheet, { header: 1 });

  if (mainData.length === 0) {
    mainData.push(['Дата', 'Общее время (ч)', project]);
  }

  const headers = mainData[0];
  const projectIndex = headers.indexOf(project);

  if (projectIndex === -1) {
    headers.push(project);
  }

  const dateRowIndex = mainData.findIndex((row, idx) => idx > 0 && row[0] === date);

  if (dateRowIndex !== -1) {
    const row = mainData[dateRowIndex];
    const currentProjectTime = parseFloat(row[projectIndex] || '0');
    row[projectIndex] = currentProjectTime + duration;

    const totalTime = headers.slice(2).reduce((sum, _, idx) => {
      return sum + parseFloat(row[idx + 2] || '0');
    }, 0);
    row[1] = totalTime;
  } else {
    const newRow: any[] = new Array(headers.length).fill(0);
    newRow[0] = date;
    newRow[projectIndex] = duration;
    newRow[1] = duration;
    mainData.push(newRow);
  }

  const newMainSheet = XLSX.utils.aoa_to_sheet(mainData);
  workbook.Sheets[MAIN_SHEET_NAME] = newMainSheet;
}

export function getProjectEntries(projectName: string): TimeEntry[] {
  initializeExcelFile();

  const excelFilePath = getExcelFilePath();
  const workbook = readWorkbook(excelFilePath);

  if (!workbook.SheetNames.includes(projectName)) {
    return [];
  }

  const projectSheet = workbook.Sheets[projectName];
  const projectData: any[][] = XLSX.utils.sheet_to_json(projectSheet, { header: 1 });

  return projectData.slice(1).map(row => ({
    date: row[0] || '',
    startTime: row[1] || '',
    endTime: row[2] || '',
    duration: parseFloat(row[3] || '0'),
    project: projectName
  }));
}

export function getActiveTimers(): Timer[] {
  initializeExcelFile();

  const excelFilePath = getExcelFilePath();
  const workbook = readWorkbook(excelFilePath);

  if (!workbook.SheetNames.includes(TIMERS_SHEET_NAME)) {
    return [];
  }

  const timersSheet = workbook.Sheets[TIMERS_SHEET_NAME];
  const timersData: any[][] = XLSX.utils.sheet_to_json(timersSheet, { header: 1 });

  return timersData.slice(1).map(row => ({
    timerId: row[0] || '',
    project: row[1] || '',
    startTime: row[2] || '',
    elapsedTime: parseFloat(row[3] || '0'),
    isRunning: row[4] === true || row[4] === 'true'
  }));
}

export function getTimer(timerId: string): Timer | null {
  const timers = getActiveTimers();
  return timers.find(t => t.timerId === timerId) || null;
}

export function startTimer(timerId: string, project: string): Timer {
  try {
    initializeExcelFile();

    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);

    const timersSheet = workbook.Sheets[TIMERS_SHEET_NAME];
    const timersData: any[][] = XLSX.utils.sheet_to_json(timersSheet, { header: 1 });

    const existingIndex = timersData.findIndex((row, idx) => idx > 0 && row[0] === timerId);

    const timer: Timer = {
      timerId,
      project,
      startTime: new Date().toISOString(),
      elapsedTime: 0,
      isRunning: true
    };

    if (existingIndex !== -1) {
      timersData[existingIndex] = [
        timer.timerId,
        timer.project,
        timer.startTime,
        timer.elapsedTime,
        timer.isRunning
      ];
    } else {
      timersData.push([
        timer.timerId,
        timer.project,
        timer.startTime,
        timer.elapsedTime,
        timer.isRunning
      ]);
    }

    const newTimersSheet = XLSX.utils.aoa_to_sheet(timersData);
    workbook.Sheets[TIMERS_SHEET_NAME] = newTimersSheet;

    writeWorkbook(workbook, excelFilePath);

    return timer;
  } catch (error) {
    console.error('Error starting timer:', error);
    throw new Error('Не удалось запустить таймер.');
  }
}

export function updateTimer(timerId: string, elapsedTime: number): Timer | null {
  try {
    initializeExcelFile();

    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);

    const timersSheet = workbook.Sheets[TIMERS_SHEET_NAME];
    const timersData: any[][] = XLSX.utils.sheet_to_json(timersSheet, { header: 1 });

    const timerIndex = timersData.findIndex((row, idx) => idx > 0 && row[0] === timerId);

    if (timerIndex === -1) {
      return null;
    }

    timersData[timerIndex][3] = elapsedTime;

    const newTimersSheet = XLSX.utils.aoa_to_sheet(timersData);
    workbook.Sheets[TIMERS_SHEET_NAME] = newTimersSheet;

    writeWorkbook(workbook, excelFilePath);

    const timer: Timer = {
      timerId: timersData[timerIndex][0],
      project: timersData[timerIndex][1],
      startTime: timersData[timerIndex][2],
      elapsedTime: timersData[timerIndex][3],
      isRunning: timersData[timerIndex][4] === true || timersData[timerIndex][4] === 'true'
    };

    return timer;
  } catch (error) {
    console.error('Error updating timer:', error);
    throw new Error('Не удалось обновить таймер.');
  }
}

export function stopTimer(timerId: string): Timer | null {
  try {
    initializeExcelFile();

    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);

    const timersSheet = workbook.Sheets[TIMERS_SHEET_NAME];
    const timersData: any[][] = XLSX.utils.sheet_to_json(timersSheet, { header: 1 });

    const timerIndex = timersData.findIndex((row, idx) => idx > 0 && row[0] === timerId);

    if (timerIndex === -1) {
      return null;
    }

    timersData[timerIndex][4] = false;

    const newTimersSheet = XLSX.utils.aoa_to_sheet(timersData);
    workbook.Sheets[TIMERS_SHEET_NAME] = newTimersSheet;

    writeWorkbook(workbook, excelFilePath);

    const timer: Timer = {
      timerId: timersData[timerIndex][0],
      project: timersData[timerIndex][1],
      startTime: timersData[timerIndex][2],
      elapsedTime: timersData[timerIndex][3],
      isRunning: false
    };

    return timer;
  } catch (error) {
    console.error('Error stopping timer:', error);
    throw new Error('Не удалось остановить таймер.');
  }
}

export function deleteTimer(timerId: string): boolean {
  try {
    initializeExcelFile();

    const excelFilePath = getExcelFilePath();
    const workbook = readWorkbook(excelFilePath);

    const timersSheet = workbook.Sheets[TIMERS_SHEET_NAME];
    const timersData: any[][] = XLSX.utils.sheet_to_json(timersSheet, { header: 1 });

    const timerIndex = timersData.findIndex((row, idx) => idx > 0 && row[0] === timerId);

    if (timerIndex === -1) {
      return false;
    }

    timersData.splice(timerIndex, 1);

    const newTimersSheet = XLSX.utils.aoa_to_sheet(timersData);
    workbook.Sheets[TIMERS_SHEET_NAME] = newTimersSheet;

    writeWorkbook(workbook, excelFilePath);

    return true;
  } catch (error) {
    console.error('Error deleting timer:', error);
    throw new Error('Не удалось удалить таймер.');
  }
}
