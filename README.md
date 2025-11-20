# Time Tracking

An application for tracking time spent on projects with data saved to Excel.

## Features

- 🎨 Modern and responsive UI with animations
- 📁 Create and manage projects (+ hourly rate)
- ⏱️ Stopwatch for time tracking (works in-memory)
- 💾 Automatic saving to Excel when stopping the timer
- 📊 Each project gets a separate sheet in Excel
- 💰 Automatic cost calculation based on rate (hours \* rate)
- 🛠️ "Project Management" window for creating and modifying rates
- 📈 Summary sheet with overview of all projects
- 🌓 Dark theme support
- ⚡ Loading and save status indicators
- 🎯 Visual feedback for all actions

## Excel File Structure

Files are automatically created in the `data/` folder with the name `time-tracking-YYYY-MM.xlsx` (e.g., `data/time-tracking-2025-11.xlsx`). A separate file is created for each month. The `data` folder is created automatically on first run. Each file contains:

### "Summary" Sheet

- "Date" column - entry date
- "Total Time (h)" column - total time per day
- For each project - a separate column with time spent

### Project Sheets

A separate sheet is created for each project with columns:

- Date (YYYY-MM-DD format, e.g. 2025-11-20)
- Start Time
- End Time
- Duration (h)
- Description
- Cost (€)

**Important:** The application automatically normalizes dates from old formats (DD.MM.YYYY) to standard ISO format (YYYY-MM-DD) when reading data. This ensures compatibility with HTML date picker and consistency throughout the system.

### Project Rate and Settings

The service sheet `_settings` is now a universal key-value storage with columns:

- Key
- Value

Project rates are saved with a key in the format:

```
project:<ProjectName>:hourlyRateEUR
```

For example: `project:Website:hourlyRateEUR -> 45`.

On first transition from the old format (columns `Project` / `HourlyRateEUR` or `_projectMeta` sheet), automatic migration to the new KV format is performed. The rate can be specified when creating a project or changed later in the "Project Management" modal. The value is stored in euros. If no rate is set, 0 is used.

### "Analytics" Sheet

Automatically created and updated when creating projects, changing rates, and adding time entries. Contains:

- Project — project name
- Hours (SUM) — formula `SUM('<Project>'!D:D)` sums durations
- Rate (€/h) — numeric value from `_settings`
- Cost (€) — formula `ROUND(Bx*Cx,2)` (hours \* rate)
- % Hours — project hours as percentage of total time `B x / SUM(B2:Bn)`
- % Cost — project cost as percentage `D x / SUM(D2:Dn)`
- Total row with sums for hours and cost

Technically, the sheet is created in the file as `Аналитика` and can be recreated — manual edits on it are not preserved.

### Cost Calculation

When saving a time entry to the project sheet, the cost in euros is calculated: `Duration * Rate` (rounded to 2 decimal places). Old sheets with a "Cost" column without currency specification will be renamed to "Cost (€)" on the next update.

## Installation and Running

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. On first run, create a project by clicking "Project Management" (optionally set the rate right away)
2. Select a project from the list (projects are displayed with icons; rate is visible under the name)
3. Click "Start" to begin tracking time
   - Timer works in memory and doesn't create disk load
   - Visual indication of running timer (pulsing effect)
4. Click "Stop" to stop and automatically save to Excel
   - A save indicator will appear
   - Data is saved only on stop
5. To change project, click "Change Project"
6. To change project rate, open "Project Management" and modify the corresponding field

### Viewing and Editing Entries

The "Edit Entries" page (`/time-entries`) allows you to:

- View all time entries for the current month
- Filter entries by project
- See overall statistics (hours and cost)
- Edit existing entries (date, time, duration)
- Delete entries
- Export data for selected project

### Exporting Project Data

For each project, an export function to a separate XLSX file is available:

**From "Project Management":**

1. Open "Project Management"
2. Click the "Export" button next to the desired project

**From the "Edit Entries" page:**

1. Go to the "Edit Entries" page
2. Select a project in the filter
3. Click the "Export [project name]" button

The file will be downloaded with a name in the format: `month-year-project.xlsx` (e.g., `11-2025-Website.xlsx`)

The exported file contains two sheets:

- **Time Entries** — all time entries for the selected project with columns: Date, Start Time, End Time, Duration (h), Description, Cost (€)
- **Analytics** — summary information: total hours, rate, total cost, number of entries, and work period

### UX Features

- Smooth animations during screen transitions
- Loading indicators for all asynchronous operations
- Visual feedback for buttons (hover, active states)
- Informative error messages
- Responsive design for different screen sizes

## Technologies

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- xlsx (for working with Excel)
- Docker (for containerization)

## Running with Docker

### Using Docker Compose (recommended)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Restart after changes
docker-compose up -d --build
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Using Docker directly

```bash
# Build image
docker build -t time-tracking-app .

# Run container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name time-tracking \
  time-tracking-app

# View logs
docker logs -f time-tracking

# Stop and remove
docker stop time-tracking
docker rm time-tracking
```

### Docker Version Features

- ✅ Multi-stage build for minimal image size
- ✅ Run as unprivileged user
- ✅ Automatic creation of `data` directory for Excel files
- ✅ Volume for data persistence between restarts
- ✅ Health check for monitoring application status
- ✅ Next.js standalone mode for optimal performance

## Troubleshooting

**Rate not updating:**

- Check that you're entering a non-negative number
- Make sure PATCH requests are not blocked by browser extensions
- Reload the page after changing the rate

**"cannot save file" error:**

- Make sure the Excel file is not open in another program
- Check access permissions to the `data/` folder
- If the error persists, close Excel and restart the application
