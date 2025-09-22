# Client Meeting Database - SQL Demo


This project implements a relational database system using MySQL and demonstrates CRUD and joins eries.

## Setup

1. Install dependencies: `npm install`
2. Update the `dbConfig` object in `index.js` with your MySQL credentials (currently set to localhost, root user, empty password)
3. Run the demo: `npm start`

## Run Options

- **Standard execution:** `npm start`
- **Save output to file (with proper Unicode support):** 
  ```powershell
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; npm start | Out-File -FilePath "SQL_Demo_Output.txt" -Encoding UTF8 -Width 200
  ```

## Features

- Raw SQL queries displayed before execution
- Complete CRUD operations
- JOIN demonstrations (INNER JOIN, LEFT JOIN)
- Meeting scheduling logic
- Database statistics and reporting

## Output

Each operation shows:
- SQL query
- Parameters (if any)
- Results in table format
- Number of rows affected


