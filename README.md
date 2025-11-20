# Time Tracking

An application for tracking time spent on projects with data saved to SQLite database.

## Features

- 🎨 Modern and responsive UI with animations
- 📁 Create and manage projects (+ hourly rate)
- ⏱️ Stopwatch for time tracking (works in-memory)
- 💾 Automatic saving to SQLite database when stopping the timer
- 📊 All project data stored in a single SQLite database
- 💰 Automatic cost calculation based on rate (hours \* rate)
- 🛠️ "Project Management" window for creating and modifying rates
- 📈 Automatic analytics calculation
- 🌓 Dark theme support
- ⚡ Loading and save status indicators
- 🎯 Visual feedback for all actions

## Database Structure

The application uses SQLite database stored in the `data/` folder as `time-tracking.db`. The `data` folder is created automatically on first run. The database contains the following tables:

### Projects Table

Stores all projects with their hourly rates:

- `id` — unique project identifier
- `name` — project name (unique)
- `hourly_rate` — hourly rate in euros (default: 0)

### Time Entries Table

Stores all time entries for all projects:

- `id` — unique entry identifier
- `project_id` — reference to project
- `date` — entry date (YYYY-MM-DD format)
- `start_time` — start time
- `end_time` — end time
- `duration` — duration in hours
- `description` — entry description (optional)

All dates are stored in ISO format (YYYY-MM-DD) for consistency with HTML date picker.

### Timers Table

Stores active and stopped timers:

- `timer_id` — unique timer identifier
- `project_id` — reference to project
- `start_time` — timer start time (ISO format)
- `elapsed_time` — elapsed time in seconds
- `is_running` — timer status (1 = running, 0 = stopped)

### Settings Table

Universal key-value storage for application settings:

- `key` — setting key
- `value` — setting value

Project hourly rates and other settings are stored here.

### Cost Calculation

When saving a time entry, the cost in euros is automatically calculated: `Duration * Rate` (rounded to 2 decimal places). The cost is calculated on-the-fly when querying data, ensuring it's always up-to-date with the current rate.

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
4. Click "Stop" to stop and automatically save to SQLite database
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

The application provides advanced XLSX export functionality with formulas, formatting, and multiple sheets.

#### Export Single Project

**From "Project Management":**

1. Open "Project Management"
2. Click the "Export" button next to the desired project

**From the "Edit Entries" page:**

1. Go to the "Edit Entries" page
2. Select a project in the filter
3. Click the "Export [project name]" button

**API Endpoint:**
```
GET /api/export?project=ProjectName
```

The exported XLSX file (`month-year-project.xlsx`) contains 3 sheets:

**1. Записи времени (Time Entries)**
- All time entries with columns: Date, Start Time, End Time, Duration (h), Cost (€)
- **Formulas**: Cost calculated as `Duration * Rate`
- **Totals row**: SUM formulas for total hours and cost
- **AutoFilter**: Enabled for easy sorting and filtering

**2. Сводка (Summary)**
- Project overview and statistics
- Hourly rate, total hours, total cost
- Work period (start/end dates)
- Statistics: unique days, average hours/day, min/max entries
- **Cross-sheet formulas**: References totals from Time Entries sheet

**3. Аналитика по датам (Analytics by Date)**
- Daily breakdown of work
- Columns: Date, # of Entries, Hours, Cost, % of Total Hours, % of Total Cost
- **Formulas**: Percentages calculated dynamically
- **Totals row**: SUM formulas for all columns
- **AutoFilter**: Enabled for sorting

#### Export All Projects

Export a comprehensive workbook with all projects:

**API Endpoint:**
```
GET /api/export?type=all
```

The exported file (`month-year-all-projects.xlsx`) contains:

**1. Все проекты (All Projects) sheet**
- Summary of all projects
- Columns: Project, Rate, Total Hours, Total Cost, # Entries, % Hours, % Cost
- **Formulas**: Automatic calculation of totals and percentages
- **AutoFilter**: Enabled for sorting by any metric

**2. Individual project sheets**
- One sheet per project (if it has entries)
- Time entries with totals
- **AutoFilter**: Enabled for easy data manipulation

#### XLSX Features

- **Formulas**: Dynamic calculations that update when you edit values
- **AutoFilter**: Click column headers to sort and filter data
- **Column widths**: Optimized for readability
- **Professional formatting**: Ready for sharing with clients or accounting
- **Excel/LibreOffice compatible**: Open and edit in any spreadsheet application

For detailed export documentation, see [EXPORT-GUIDE.md](EXPORT-GUIDE.md).

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
- better-sqlite3 (for SQLite database)
- xlsx (for Excel export with formulas)
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
- ✅ Automatic creation of `data` directory for SQLite database
- ✅ Volume for data persistence between restarts
- ✅ Health check for monitoring application status
- ✅ Next.js standalone mode for optimal performance
- ✅ SQLite3 included in container

## Troubleshooting

**Rate not updating:**

- Check that you're entering a non-negative number
- Make sure PATCH requests are not blocked by browser extensions
- Reload the page after changing the rate

**"cannot save data" error:**

- Check access permissions to the `data/` folder
- Make sure the SQLite database file is not locked by another process
- If the error persists, restart the application
