# Export Guide

This guide explains how to use the advanced XLSX export functionality in the Time Tracking application.

## Overview

The application provides two export modes:
1. **Single Project Export** - Export detailed data for one project
2. **All Projects Export** - Export summary and detailed data for all projects

Both modes generate XLSX files with formulas, autofilters, and professional formatting.

## Single Project Export

### How to Export

**Method 1: From Project Management**
1. Click "Project Management" button
2. Find your project in the list
3. Click the "Export" button next to the project name

**Method 2: From Time Entries Page**
1. Navigate to `/time-entries`
2. Select a project from the dropdown filter
3. Click the "Export [ProjectName]" button

**Method 3: Using API**
```bash
curl "http://localhost:3000/api/export?project=MyProject" -o export.xlsx
```

### File Contents

The exported file contains **3 sheets**:

#### Sheet 1: Записи времени (Time Entries)

All time entries for the project with automatic calculations.

| Column | Description | Formula Example |
|--------|-------------|----------------|
| Дата | Entry date | - |
| Время начала | Start time | - |
| Время окончания | End time | - |
| Длительность (ч) | Duration in hours | - |
| Стоимость (€) | Cost | `=D2*45` (Duration × Rate) |

**Totals Row:**
- Total Hours: `=SUM(D2:D100)`
- Total Cost: `=SUM(E2:E100)`

**Features:**
- ✅ AutoFilter enabled - click headers to sort/filter
- ✅ Formulas update when you change rate
- ✅ Ready for Excel/LibreOffice/Google Sheets

#### Sheet 2: Сводка (Summary)

Project overview and statistics.

**Includes:**
- Project name and hourly rate
- Total entries, hours, and cost (linked to Time Entries sheet)
- Work period (first and last entry dates)
- Statistics:
  - Unique working days
  - Average hours per day
  - Min/Max entry duration

**Cross-Sheet Formulas:**
```excel
Total Hours: ='Записи времени'!D101
Total Cost: ='Записи времени'!E101
```

These formulas reference the totals from the Time Entries sheet, so they update automatically.

#### Sheet 3: Аналитика по датам (Analytics by Date)

Daily breakdown of work with percentages.

| Column | Formula | Description |
|--------|---------|-------------|
| Дата | - | Date |
| Записей | - | Number of entries |
| Часов | - | Total hours for date |
| Стоимость (€) | - | Total cost for date |
| % от общего времени | `=C2/150` | Percentage of total hours |
| % от общей стоимости | `=D2/6750` | Percentage of total cost |

**Features:**
- ✅ Sorted by date (newest first)
- ✅ AutoFilter for custom sorting
- ✅ Percentage formulas update dynamically
- ✅ Totals row with SUM formulas

## All Projects Export

### How to Export

**Using API:**
```bash
curl "http://localhost:3000/api/export?type=all" -o all-projects.xlsx
```

### File Contents

#### Sheet 1: Все проекты (All Projects)

Summary table with all projects.

| Column | Formula | Description |
|--------|---------|-------------|
| Проект | - | Project name |
| Ставка (€/ч) | - | Hourly rate |
| Всего часов | - | Total hours |
| Общая стоимость (€) | - | Total cost |
| Записей | - | Number of entries |
| % от общих часов | `=C2/SUM(C:C)` | % of all hours |
| % от общей стоимости | `=D2/SUM(D:D)` | % of all costs |

**Totals Row:**
- Sums all hours, costs, and entries
- Percentage columns sum to 100%

**Features:**
- ✅ Compare projects side-by-side
- ✅ Sort by any metric (rate, hours, cost, etc.)
- ✅ Professional summary for reporting

#### Sheets 2-N: Individual Project Sheets

One sheet per project (only if project has entries).

**Contents:**
- All time entries
- Totals row with SUM formulas
- AutoFilter enabled

**Example:**
```
Sheet: "Website Design"
  Date       | Start  | End    | Hours | Cost (€)
  2025-11-20 | 09:00  | 17:00  | 8.0   | 360.00
  2025-11-19 | 10:00  | 15:00  | 5.0   | 225.00
  ИТОГО      |        |        | =SUM  | =SUM
```

## Using Exported Files

### In Excel

1. **Sorting**: Click column headers, use Sort & Filter
2. **Filtering**: Click dropdown arrows in headers
3. **Editing**: Change rate or hours - formulas auto-update
4. **Charts**: Create charts from data (Insert > Chart)
5. **Pivot Tables**: Analyze data (Insert > PivotTable)

### In Google Sheets

1. Upload XLSX file to Google Drive
2. Open with Google Sheets
3. Formulas and formatting preserved
4. Share with team members

### In LibreOffice Calc

1. Open XLSX file
2. All features supported
3. Save as ODS if needed

## Advanced Tips

### Custom Analysis

Edit the exported file to add your own formulas:

```excel
// Calculate hourly utilization
=Hours_This_Week / 40

// Calculate profitability
=(Revenue - (Hours * Rate)) / Revenue

// Compare months
=SUMIF(Date_Column, "2025-11", Hours_Column)
```

### Data Validation

Add data validation to prevent errors:

1. Select duration column
2. Data > Data Validation
3. Set min/max values

### Conditional Formatting

Highlight important data:

1. Select cost column
2. Home > Conditional Formatting
3. Add rules (e.g., highlight if > €1000)

### Sharing with Clients

**Template for Invoice:**

1. Export project data
2. Copy Summary sheet data
3. Paste into invoice template
4. Send to client

**Example:**
```
Project: Website Design
Period: Nov 1-20, 2025
Total Hours: 150
Rate: €45/hour
Total: €6,750
```

## Troubleshooting

**Q: Formulas show as text (e.g., "=SUM(A1:A10)")**

A: Your spreadsheet locale may use semicolons instead of commas. Change formula separators in Excel settings, or use Find & Replace to change `,` to `;`.

**Q: Dates appear as numbers**

A: Select the column, Format > Cells > Date, choose your preferred format.

**Q: Export fails with "No entries found"**

A: The project has no time entries. Add at least one entry before exporting.

**Q: Can I export specific date ranges?**

A: Not directly. Export all data, then use AutoFilter to filter by date range.

**Q: How to export to PDF?**

A: Open XLSX in Excel/LibreOffice, then File > Export as PDF or File > Print to PDF.

## API Reference

### Export Single Project

```http
GET /api/export?project={projectName}
```

**Parameters:**
- `project` (required): URL-encoded project name

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File: `{month}-{year}-{project}.xlsx`

**Example:**
```bash
curl "http://localhost:3000/api/export?project=Website%20Design" \
  -o website-design.xlsx
```

### Export All Projects

```http
GET /api/export?type=all
```

**Parameters:**
- `type=all`: Export all projects

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File: `{month}-{year}-all-projects.xlsx`

**Example:**
```bash
curl "http://localhost:3000/api/export?type=all" \
  -o all-projects.xlsx
```

## Examples

### Monthly Invoice Preparation

```bash
# 1. Export all projects for the month
curl "http://localhost:3000/api/export?type=all" -o november-2025.xlsx

# 2. Open in Excel
# 3. Review "Все проекты" sheet
# 4. Copy project totals to invoice
# 5. Send individual project sheets to clients if needed
```

### Project Analysis

```bash
# Export specific project
curl "http://localhost:3000/api/export?project=Website%20Design" -o project.xlsx

# Open "Аналитика по датам" sheet
# Sort by hours (descending) to find most productive days
# Filter by date range for specific period
# Create chart from daily data
```

### Team Reporting

```bash
# Export all projects
curl "http://localhost:3000/api/export?type=all" -o team-report.xlsx

# Share file with team
# Each member reviews their project sheet
# Manager reviews "Все проекты" summary
```

## Future Enhancements

Planned features for future releases:

- [ ] Custom date range filtering
- [ ] Weekly/Monthly summary sheets
- [ ] Comparison between periods
- [ ] Budget vs Actual reports
- [ ] Client-specific multi-project exports
- [ ] Custom templates support
