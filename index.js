const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    ssl: false
};

let connection;

// Helper function to execute SQL and show the query
async function executeSQL(query, params = [], description = '') {
    if (description) {
        console.log(`\n=== ${description} ===`);
    }
    
    console.log('\nSQL Query:');
    console.log(query);
    
    if (params.length > 0) {
        console.log('\nParameters:', params);
    }
    
    try {
        // Use query() for DDL operations that don't support prepared statements
        const isDDL = /^\s*(CREATE|DROP|USE|ALTER|SHOW)\s+/i.test(query.trim());
        const [rows] = isDDL ? await connection.query(query) : await connection.execute(query, params);
        
        if (Array.isArray(rows) && rows.length > 0) {
            console.log(`\nResult: ${rows.length} row(s) affected/returned`);
            
            // Show results for SELECT queries (limit to first 5 rows for readability)
            if (query.trim().toUpperCase().startsWith('SELECT')) {
                console.log('\nData returned:');
                console.table(rows.slice(0, 5));
                if (rows.length > 5) {
                    console.log(`... and ${rows.length - 5} more rows`);
                }
            }
        } else if (rows.affectedRows !== undefined) {
            console.log(`\nResult: ${rows.affectedRows} row(s) affected`);
            if (rows.insertId) {
                console.log(`Insert ID: ${rows.insertId}`);
            }
        } else {
            console.log('\nResult: Command executed successfully');
        }
        
        return rows;
    } catch (error) {
        console.error('\nSQL Error:', error.message);
        throw error;
    }
}

async function main() {
    console.log('Designing and Managing Client Databases Using SQL');
    console.log('='.repeat(60));
    console.log('Course-end Project: Client and Meeting Management System');
    console.log('='.repeat(60));

    try {
        // 1. CONNECT TO DATABASE
        console.log('\nCONNECTING TO MYSQL...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL server');

        // 2. CREATE DATABASE
        await executeSQL(
            `CREATE DATABASE IF NOT EXISTS \`clientDB\``,
            [],
            'CREATE DATABASE'
        );

        await executeSQL(
            'USE clientDB',
            [],
            'SELECT DATABASE'
        );

        // 3. DROP EXISTING TABLES (Clean slate)
        await executeSQL(
            'DROP TABLE IF EXISTS meetings',
            [],
            'DROP MEETINGS TABLE'
        );

        await executeSQL(
            'DROP TABLE IF EXISTS clients',
            [],
            'DROP CLIENTS TABLE'
        );

        // 4. CREATE CLIENTS TABLE
        const createClientsSQL = `
            CREATE TABLE clients (
                client_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                company VARCHAR(100),
                phone VARCHAR(20),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_company (company)
            )
        `;

        await executeSQL(createClientsSQL, [], 'CREATE CLIENTS TABLE');

        // 5. CREATE MEETINGS TABLE WITH FOREIGN KEY
        const createMeetingsSQL = `
            CREATE TABLE meetings (
                meeting_id INT AUTO_INCREMENT PRIMARY KEY,
                client_id INT NOT NULL,
                event_name VARCHAR(200) NOT NULL,
                meeting_date DATE NOT NULL,
                meeting_time TIME NOT NULL,
                subject VARCHAR(300) NOT NULL,
                agenda TEXT,
                meeting_details TEXT,
                meeting_minutes TEXT,
                status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
                INDEX idx_client_id (client_id),
                INDEX idx_meeting_date (meeting_date),
                INDEX idx_status (status)
            )
        `;

        await executeSQL(createMeetingsSQL, [], 'CREATE MEETINGS TABLE WITH FOREIGN KEY');

        // 6. INSERT SAMPLE CLIENTS (CREATE operations - Multi-row INSERT)
        console.log('\nINSERTING SAMPLE DATA...');
        
        const clientInsertSQL = `
            INSERT INTO clients (name, email, company, phone, address) 
            VALUES 
                (?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?)
        `;

        const clients = [
            'John Smith', 'john.smith@techcorp.com', 'TechCorp Inc.', '+1-555-0101', '123 Tech Street, Silicon Valley, CA',
            'Sarah Johnson', 'sarah.johnson@innovate.com', 'Innovate Solutions', '+1-555-0102', '456 Innovation Ave, Austin, TX',
            'Michael Chen', 'michael.chen@globaltech.com', 'Global Tech Ltd.', '+1-555-0103', '789 Global Plaza, New York, NY',
            'Emily Davis', 'emily.davis@startup.io', 'NextGen Startup', '+1-555-0104', '321 Startup Blvd, San Francisco, CA'
        ];

        await executeSQL(clientInsertSQL, clients, 'INSERT ALL CLIENTS (Multi-row INSERT)');

        // 7. INSERT SAMPLE MEETINGS (with realistic dates)
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const formatDate = (date) => date.toISOString().split('T')[0];

        const meetingInsertSQL = `
            INSERT INTO meetings (client_id, event_name, meeting_date, meeting_time, subject, agenda, meeting_details, meeting_minutes, status) 
            VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const meetings = [
            1, 'Project Kickoff', formatDate(yesterday), '10:00:00', 'Initial project discussion', 'Discuss project scope and timeline', 'Kickoff meeting for new project', 'Scope defined, timeline approved', 'completed',
            2, 'Product Demo', formatDate(today), '14:30:00', 'Software demonstration', 'Present new features', 'Demo of latest updates', null, 'scheduled',
            3, 'Contract Review', formatDate(nextWeek), '09:00:00', 'Legal contract discussion', 'Review terms and conditions', 'Contract negotiation meeting', null, 'scheduled'
        ];

        await executeSQL(meetingInsertSQL, meetings, 'INSERT ALL MEETINGS (Multi-row INSERT)');

        // 8. READ OPERATIONS - Show all clients
        await executeSQL(
            'SELECT * FROM clients ORDER BY name',
            [],
            'READ - GET ALL CLIENTS'
        );

        // 9. READ OPERATIONS - Show all meetings with client info (INNER JOIN)
        const joinSQL = `
            SELECT 
                m.meeting_id,
                m.event_name,
                m.meeting_date,
                m.meeting_time,
                m.subject,
                m.status,
                c.name as client_name,
                c.email as client_email,
                c.company as client_company
            FROM meetings m
            INNER JOIN clients c ON m.client_id = c.client_id
            ORDER BY m.meeting_date, m.meeting_time
        `;

        await executeSQL(joinSQL, [], 'INNER JOIN - MEETINGS WITH CLIENT INFO');

        // 10. LEFT JOIN - All clients with their meeting counts
        const leftJoinSQL = `
            SELECT 
                c.client_id,
                c.name,
                c.email,
                c.company,
                COUNT(m.meeting_id) as total_meetings,
                COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as scheduled_meetings,
                COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_meetings
            FROM clients c
            LEFT JOIN meetings m ON c.client_id = m.client_id
            GROUP BY c.client_id, c.name, c.email, c.company
            ORDER BY total_meetings DESC, c.name
        `;

        await executeSQL(leftJoinSQL, [], 'LEFT JOIN - ALL CLIENTS WITH MEETING COUNTS');

        // 11. MEETING SCHEDULING DEMO - Find available slots
        const availabilitySQL = `
            SELECT 
                DATE_ADD(CURDATE(), INTERVAL 1 DAY) as available_date,
                '09:00:00' as available_time
            WHERE NOT EXISTS (
                SELECT 1 FROM meetings m 
                WHERE m.meeting_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                AND m.meeting_time = '09:00:00'
                AND m.status != 'cancelled'
            )
            UNION ALL
            SELECT 
                DATE_ADD(CURDATE(), INTERVAL 1 DAY) as available_date,
                '10:00:00' as available_time
            WHERE NOT EXISTS (
                SELECT 1 FROM meetings m 
                WHERE m.meeting_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                AND m.meeting_time = '10:00:00'
                AND m.status != 'cancelled'
            )
            LIMIT 3
        `;

        await executeSQL(availabilitySQL, [], 'AVAILABILITY CHECK - FIND OPEN MEETING SLOTS');

        // 12. SCHEDULE A NEW MEETING
        const newMeetingDate = new Date(today);
        newMeetingDate.setDate(newMeetingDate.getDate() + 2);

        const singleMeetingInsertSQL = `
            INSERT INTO meetings (client_id, event_name, meeting_date, meeting_time, subject, agenda, meeting_details, meeting_minutes, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await executeSQL(
            singleMeetingInsertSQL,
            [1, 'Follow-up Meeting', formatDate(newMeetingDate), '11:00:00', 'Project status update', 'Review progress and next steps', 'Weekly check-in meeting', null, 'scheduled'],
            'CREATE - SCHEDULE NEW MEETING'
        );

        // 13. UPDATE - Add meeting minutes to completed meeting
        const updateSQL = `
            UPDATE meetings 
            SET meeting_minutes = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP
            WHERE meeting_id = 1
        `;

        await executeSQL(
            updateSQL,
            ['Meeting completed successfully. All objectives met. Next steps: Begin development phase.'],
            'UPDATE - ADD MEETING MINUTES'
        );

        // 14. SEARCH OPERATIONS - Find clients by company
        await executeSQL(
            'SELECT * FROM clients WHERE company LIKE ? ORDER BY name',
            ['%Tech%'],
            'SEARCH - FIND CLIENTS BY COMPANY (LIKE operator)'
        );

        // 15. DELETE OPERATION - Cancel a meeting (soft delete)
        await executeSQL(
            `UPDATE meetings SET status = 'cancelled', meeting_minutes = 'Meeting cancelled due to schedule conflict' WHERE meeting_id = 3`,
            [],
            'UPDATE - CANCEL MEETING (SOFT DELETE)'
        );

        // 16. HARD DELETE DEMONSTRATION - Delete a specific meeting permanently
        await executeSQL(
            'DELETE FROM meetings WHERE meeting_id = ? AND status = ?',
            [3, 'cancelled'],
            'HARD DELETE - PERMANENTLY REMOVE CANCELLED MEETING'
        );

        // 17. VERIFY DELETE - Show remaining meetings
        await executeSQL(
            'SELECT meeting_id, event_name, status FROM meetings ORDER BY meeting_id',
            [],
            'VERIFY DELETE - SHOW REMAINING MEETINGS'
        );

        // 18. HARD DELETE WITH CASCADE DEMO - Delete a client (will cascade to meetings)
        // First, let's add a temporary client with a meeting
        await executeSQL(
            `INSERT INTO clients (name, email, company, phone) VALUES (?, ?, ?, ?)`,
            ['Temp Client', 'temp@example.com', 'Temp Corp', '+1-555-9999'],
            'INSERT TEMPORARY CLIENT FOR CASCADE DEMO'
        );

        // Get the client ID for the temporary client
        const tempClientResult = await executeSQL(
            'SELECT client_id FROM clients WHERE email = ?',
            ['temp@example.com'],
            'GET TEMPORARY CLIENT ID'
        );

        const tempClientId = tempClientResult[0].client_id;

        // Add a meeting for the temporary client
        await executeSQL(
            `INSERT INTO meetings (client_id, event_name, meeting_date, meeting_time, subject, status) 
             VALUES (?, ?, CURDATE(), '15:00:00', ?, 'scheduled')`,
            [tempClientId, 'Temp Meeting', 'Temporary meeting for cascade demo'],
            'INSERT TEMPORARY MEETING FOR CASCADE DEMO'
        );

        // Show meetings before cascade delete
        await executeSQL(
            'SELECT m.meeting_id, m.event_name, c.name as client_name FROM meetings m JOIN clients c ON m.client_id = c.client_id WHERE c.email = ?',
            ['temp@example.com'],
            'SHOW MEETINGS BEFORE CASCADE DELETE'
        );

        // Now delete the client - this will cascade delete the meeting
        await executeSQL(
            'DELETE FROM clients WHERE email = ?',
            ['temp@example.com'],
            'HARD DELETE WITH CASCADE - DELETE CLIENT (WILL DELETE ASSOCIATED MEETINGS)'
        );

        // Verify cascade delete worked
        await executeSQL(
            'SELECT COUNT(*) as remaining_temp_meetings FROM meetings WHERE client_id = ?',
            [tempClientId],
            'VERIFY CASCADE DELETE - COUNT REMAINING TEMP MEETINGS (SHOULD BE 0)'
        );

        // 19. FINAL SUMMARY QUERY
        const summarySQL = `
            SELECT 
                'Total Clients' as metric,
                COUNT(*) as count
            FROM clients
            UNION ALL
            SELECT 
                'Total Meetings' as metric,
                COUNT(*) as count
            FROM meetings
            UNION ALL
            SELECT 
                'Scheduled Meetings' as metric,
                COUNT(*) as count
            FROM meetings 
            WHERE status = 'scheduled'
            UNION ALL
            SELECT 
                'Completed Meetings' as metric,
                COUNT(*) as count
            FROM meetings 
            WHERE status = 'completed'
        `;

        await executeSQL(summarySQL, [], 'SUMMARY - DATABASE STATISTICS');

        console.log('\nSQL DEMONSTRATION COMPLETED SUCCESSFULLY!');
        console.log('\nDemonstrated SQL Operations:');
        console.log('DDL: CREATE DATABASE, CREATE TABLE, DROP TABLE');
        console.log('DML: INSERT, UPDATE, SELECT, DELETE');
        console.log('JOINS: INNER JOIN, LEFT JOIN');
        console.log('ADVANCED: Aggregation, LIKE operator, UNION');
        console.log('RELATIONSHIPS: Foreign Keys, Cascading operations');
        console.log('PRACTICAL: Meeting scheduling, availability checking');
        console.log('DELETE OPERATIONS: Soft delete (status change) and Hard delete (permanent removal)');

    } catch (error) {
        console.error('\nError:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDisconnected from MySQL');
        }
    }
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
