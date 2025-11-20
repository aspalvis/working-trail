# Migration from Excel to SQLite

## Overview

Starting from version 1.0.3, the application has been migrated from Excel-based storage to SQLite database. This change provides better performance, reliability, and scalability.

## What Changed

- **Storage**: Data is now stored in `data/time-tracking.db` instead of `data/time-tracking-YYYY-MM.xlsx`
- **Export format**: Enhanced XLSX export with multiple sheets, formulas, and autofilters
- **Dependencies**: Added `better-sqlite3` for database, kept `xlsx` for export functionality

## Migration Steps

If you have existing data in Excel files, you'll need to migrate it manually:

### Option 1: Start Fresh (Recommended for New Users)

1. Delete or backup your old `data/*.xlsx` files
2. Start the application - it will create a new SQLite database automatically
3. Re-enter your projects and time entries

### Option 2: Manual Migration (For Users with Important Data)

1. **Backup your Excel files**:
   ```bash
   mkdir backup
   cp data/*.xlsx backup/
   ```

2. **Export your data from Excel** to CSV format using Excel or LibreOffice

3. **Import to SQLite** - You can use a tool like [DB Browser for SQLite](https://sqlitebrowser.org/) to import CSV data

4. **Database schema**:
   ```sql
   -- Projects table
   CREATE TABLE projects (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT UNIQUE NOT NULL,
     hourly_rate REAL DEFAULT 0
   );

   -- Time entries table
   CREATE TABLE time_entries (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     project_id INTEGER NOT NULL,
     date TEXT NOT NULL,
     start_time TEXT NOT NULL,
     end_time TEXT NOT NULL,
     duration REAL NOT NULL,
     description TEXT,
     FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
   );
   ```

### Option 3: Keep Excel Files as Archive

You can keep your Excel files in a separate folder for reference:

```bash
mkdir archive
mv data/*.xlsx archive/
```

The application will create a new SQLite database in the `data/` folder.

## Benefits of SQLite

- **Performance**: Faster read/write operations
- **Reliability**: No more "file is open in another program" errors
- **Concurrent access**: Multiple processes can read the database simultaneously
- **Data integrity**: ACID compliance ensures data consistency
- **Smaller file size**: More efficient storage compared to Excel
- **Better querying**: SQL queries for complex analytics

## Docker Users

The Docker image now includes SQLite3 support. No additional configuration needed:

```bash
# Pull the latest image
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

Your data volume (`./data`) will be preserved, and a new SQLite database will be created.

## Troubleshooting

**Q: Can I still open the data files in Excel?**
A: No, SQLite databases are binary files. However, you can:
- Use [DB Browser for SQLite](https://sqlitebrowser.org/) to view/edit data
- Export data to CSV using the built-in export function
- Use SQL queries to analyze your data

**Q: How do I backup my data?**
A: Simply backup the `data/time-tracking.db` file:
```bash
cp data/time-tracking.db backup/time-tracking-$(date +%Y%m%d).db
```

**Q: Can I migrate back to Excel?**
A: The Excel-based version is available in git history (commit before v1.0.3). However, we recommend staying on SQLite for better performance and reliability.

## Support

If you encounter any issues during migration, please:
1. Check the [README.md](README.md) for updated documentation
2. Open an issue on GitHub with details about your problem
3. Include your error logs from `docker logs` or console output
