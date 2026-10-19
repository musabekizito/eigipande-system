const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const verifyPassword = async (password, storedPassword) => {
    if (/^\$2[aby]\$\d{2}\$/.test(storedPassword)) {
        return bcrypt.compare(password, storedPassword);
    }
    return password === storedPassword;
};

const validateManagerActivityActor = async (managerId) => {
    const parsedManagerId = Number(managerId);
    if (!Number.isInteger(parsedManagerId) || parsedManagerId <= 0) {
        const error = new Error('A valid manager ID is required to record this activity.');
        error.status = 400;
        throw error;
    }

    const [managers] = await db.query(
        'SELECT id, name, role FROM users WHERE id = ? AND role IN (?, ?) LIMIT 1',
        [parsedManagerId, 'manager', 'admin']
    );
    if (managers.length === 0) {
        const error = new Error('Manager account not found for activity tracking.');
        error.status = 403;
        throw error;
    }
    return managers[0];
};

const logManagerActivity = async (managerId, action, details, category = 'users') => {
    const manager = await validateManagerActivityActor(managerId);
    const [result] = await db.query(
        'INSERT INTO manager_activity_log (manager_id, manager_name, action, details) VALUES (?, ?, ?, ?)',
        [manager.id, manager.name, action, details]
    );
    await logSystemActivity(
        manager.id,
        manager.name,
        manager.role,
        category,
        action,
        details,
        result.insertId
    );
};

const logSystemActivity = async (
    actorId,
    actorName,
    actorRole,
    category,
    action,
    details,
    managerActivityId = null,
    ipAddress = null
) => {
    await db.query(
        `INSERT INTO system_logs
            (user_id, actor_id, actor_name, actor_role, category, action, details, manager_activity_id, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            actorId || null,
            actorId || null,
            String(actorName || 'System').slice(0, 255),
            String(actorRole || 'system').slice(0, 50),
            String(category).slice(0, 50),
            String(action).slice(0, 120),
            String(details || '').slice(0, 1000),
            managerActivityId,
            ipAddress ? String(ipAddress).slice(0, 45) : null,
        ]
    );
};

const logUserSystemActivity = async (userId, category, action, details) => {
    const [users] = await db.query(
        'SELECT id, name, role FROM users WHERE id = ? LIMIT 1',
        [userId]
    );
    if (users.length === 0) {
        const error = new Error('User account not found for system log.');
        error.status = 404;
        throw error;
    }
    const actor = users[0];
    await logSystemActivity(actor.id, actor.name, actor.role, category, action, details);
};

const requireAdminAccount = async (adminId) => {
    const parsedAdminId = Number(adminId);
    if (!Number.isInteger(parsedAdminId) || parsedAdminId <= 0) return false;
    const [admins] = await db.query(
        'SELECT id FROM users WHERE id = ? AND role = ? LIMIT 1',
        [parsedAdminId, 'admin']
    );
    return admins.length > 0;
};

const ensureSystemLogColumn = async (columnName, definition) => {
    const [columns] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'system_logs'
           AND COLUMN_NAME = ?`,
        [columnName]
    );
    if (columns.length === 0) {
        await db.query(`ALTER TABLE system_logs ADD COLUMN \`${columnName}\` ${definition}`);
    }
};

const ensureSystemLogIndex = async (indexName, definition) => {
    const [indexes] = await db.query(
        `SELECT INDEX_NAME
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'system_logs'
           AND INDEX_NAME = ?
         LIMIT 1`,
        [indexName]
    );
    if (indexes.length === 0) {
        await db.query(`ALTER TABLE system_logs ADD ${definition}`);
    }
};

const ensureSystemLogForeignKey = async () => {
    const [foreignKeys] = await db.query(
        `SELECT CONSTRAINT_NAME
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'system_logs'
           AND COLUMN_NAME = 'manager_activity_id'
           AND REFERENCED_TABLE_NAME = 'manager_activity_log'
           AND REFERENCED_COLUMN_NAME = 'id'
         LIMIT 1`
    );
    if (foreignKeys.length === 0) {
        await db.query(`
            ALTER TABLE system_logs
            ADD CONSTRAINT fk_system_logs_manager_activity
            FOREIGN KEY (manager_activity_id)
            REFERENCES manager_activity_log (id)
            ON UPDATE CASCADE
            ON DELETE SET NULL
        `);
    }
};

// ============================================================
// FIRST-RUN ADMIN SETUP
// ============================================================
const ADMIN_SETUP_LOCK = 'eigipande_initial_admin_setup';

app.get('/api/admin/manager-activity', async (req, res) => {
    try {
        if (!await requireAdminAccount(req.query.adminId)) {
            return res.status(403).json({ success: false, message: 'Admin access is required.' });
        }
        const [records] = await db.query(
            `SELECT id, manager_id AS managerId, manager_name AS managerName,
                    action, details, created_at AS createdAt
             FROM manager_activity_log
             ORDER BY created_at DESC, id DESC
             LIMIT 100`
        );
        res.json(records);
    } catch (error) {
        console.error('Manager activity query error:', error);
        res.status(500).json({ success: false, message: 'Could not load manager activity.' });
    }
});

app.get('/api/admin/system-logs', async (req, res) => {
    try {
        if (!await requireAdminAccount(req.query.adminId)) {
            return res.status(403).json({ success: false, message: 'Admin access is required.' });
        }

        const allowedCategories = ['auth', 'users', 'attendance', 'leaves', 'reports', 'security'];
        const category = allowedCategories.includes(req.query.category) ? req.query.category : '';
        const search = String(req.query.search || '').trim().slice(0, 100);
        const requestedPage = Number.parseInt(req.query.page, 10);
        const safeRequestedPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
        const pageSize = 10;
        const conditions = [];
        const params = [];
        if (category) {
            conditions.push('category = ?');
            params.push(category);
        }
        if (search) {
            conditions.push('(actor_name LIKE ? OR action LIKE ? OR details LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [countRows] = await db.query(
            `SELECT COUNT(*) AS total FROM system_logs ${whereClause}`,
            params
        );
        const total = Number(countRows[0].total);
        const page = Math.min(safeRequestedPage, Math.max(1, Math.ceil(total / pageSize)));
        const [records] = await db.query(
            `SELECT id, user_id AS userId, actor_id AS actorId, actor_name AS actorName,
                    actor_role AS actorRole, category, action, details, ip_address AS ipAddress,
                    created_at AS createdAt
             FROM system_logs
             ${whereClause}
             ORDER BY created_at DESC, id DESC
             LIMIT ? OFFSET ?`,
            [...params, pageSize, (page - 1) * pageSize]
        );
        res.json({ records, total, page, pageSize });
    } catch (error) {
        console.error('System logs query error:', error);
        res.status(500).json({ success: false, message: 'Could not load system logs.' });
    }
});

app.get('/api/setup/admin-status', async (req, res) => {
    try {
        if (!process.env.ADMIN_SETUP_KEY) {
            return res.json({ available: false });
        }
        const [admins] = await db.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
        res.json({ available: admins.length === 0 });
    } catch (error) {
        console.error('Admin setup status error:', error);
        res.status(500).json({ success: false, message: 'Could not check admin setup status.' });
    }
});

app.post('/api/setup/admin', async (req, res) => {
    const { name, email, password, setupKey } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !setupKey) {
        return res.status(400).json({ success: false, message: 'Name, email, password, and setup key are required.' });
    }
    if (password.length < 12) {
        return res.status(400).json({ success: false, message: 'Admin password must be at least 12 characters.' });
    }

    const configuredKey = process.env.ADMIN_SETUP_KEY;
    const submittedKey = String(setupKey);
    if (!configuredKey) {
        return res.status(503).json({ success: false, message: 'Initial admin setup is not configured on the server.' });
    }
    const configuredKeyBuffer = Buffer.from(configuredKey);
    const submittedKeyBuffer = Buffer.from(submittedKey);
    if (configuredKeyBuffer.length !== submittedKeyBuffer.length ||
        !crypto.timingSafeEqual(configuredKeyBuffer, submittedKeyBuffer)) {
        return res.status(403).json({ success: false, message: 'The setup key is invalid.' });
    }

    let connection;
    let lockAcquired = false;
    try {
        connection = await db.getConnection();
        const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [ADMIN_SETUP_LOCK]);
        lockAcquired = lockRows[0].acquired === 1;
        if (!lockAcquired) {
            return res.status(503).json({ success: false, message: 'Admin setup is busy. Please try again.' });
        }

        const [admins] = await connection.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
        if (admins.length > 0) {
            return res.status(409).json({ success: false, message: 'The initial admin account has already been created.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await connection.query(
            'INSERT INTO users (name, email, password, role, department, badge_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name.trim(), normalizedEmail, hashedPassword, 'admin', 'Management', null]
        );
        await logSystemActivity(result.insertId, name.trim(), 'admin', 'users', 'Created initial admin account', 'Initial system administrator account created.');
        res.status(201).json({
            success: true,
            message: 'Admin account created.',
            user: {
                id: result.insertId,
                name: name.trim(),
                role: 'admin',
                department: 'Management',
                badge_id: null,
            },
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }
        console.error('Initial admin setup error:', error);
        res.status(500).json({ success: false, message: 'Could not create the initial admin account.' });
    } finally {
        if (connection) {
            if (lockAcquired) {
                try {
                    await connection.query('SELECT RELEASE_LOCK(?)', [ADMIN_SETUP_LOCK]);
                } catch (error) {
                    console.error('Could not release admin setup lock:', error);
                }
            }
            connection.release();
        }
    }
});

app.post('/api/admin/create-admin', async (req, res) => {
    const { name, email, password, setupKey } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !setupKey) {
        return res.status(400).json({ success: false, message: 'Name, email, password, and admin creation key are required.' });
    }
    if (password.length < 12) {
        return res.status(400).json({ success: false, message: 'Admin password must be at least 12 characters.' });
    }

    const configuredKey = process.env.ADMIN_SETUP_KEY;
    if (!configuredKey) {
        return res.status(503).json({ success: false, message: 'Admin creation is not configured. Set ADMIN_SETUP_KEY on the server.' });
    }
    const configuredKeyBuffer = Buffer.from(configuredKey);
    const submittedKeyBuffer = Buffer.from(String(setupKey));
    if (configuredKeyBuffer.length !== submittedKeyBuffer.length ||
        !crypto.timingSafeEqual(configuredKeyBuffer, submittedKeyBuffer)) {
        return res.status(403).json({ success: false, message: 'The admin creation key is invalid.' });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1',
            [normalizedEmail]
        );
        if (existingUsers.length > 0) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, department, badge_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name.trim(), normalizedEmail, hashedPassword, 'admin', 'Management', null]
        );
        await logSystemActivity(result.insertId, name.trim(), 'admin', 'users', 'Created admin account', 'Admin account created.');
        res.status(201).json({
            success: true,
            message: 'Admin account created.',
            user: {
                id: result.insertId,
                name: name.trim(),
                role: 'admin',
                department: 'Management',
                badge_id: null,
            },
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }
        console.error('Admin account creation error:', error);
        res.status(500).json({ success: false, message: 'Could not create the admin account.' });
    }
});

// ============================================================
// AUTH: LOGIN
// ============================================================
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const [users] = await db.query('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
        if (users.length === 0) {
            await logSystemActivity(null, 'Unknown user', 'anonymous', 'security', 'Failed sign-in', 'Sign-in attempt rejected due to invalid credentials.', null, req.ip);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const user = users[0];
        const valid = await verifyPassword(password, user.password);
        if (!valid) {
            await logSystemActivity(null, 'Unknown user', 'anonymous', 'security', 'Failed sign-in', 'Sign-in attempt rejected due to invalid credentials.', null, req.ip);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        await logSystemActivity(
            user.id,
            user.name,
            user.role,
            'auth',
            'Signed in',
            'User signed in successfully.',
            null,
            req.ip
        );
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                department: user.department,
                badge_id: user.badge_id,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'The sign-in service is temporarily unavailable. Please try again.' });
    }
});

// ============================================================
// PUBLIC REGISTRATION
// ============================================================
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, department, badge_id, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    try {
        const [admins] = await db.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
        if (admins.length === 0) {
            return res.status(403).json({ success: false, message: 'The initial system administrator must be set up before account registration.' });
        }
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        if (badge_id) {
            const [badgeCheck] = await db.query('SELECT * FROM users WHERE badge_id = ?', [badge_id]);
            if (badgeCheck.length > 0) {
                return res.status(400).json({ success: false, message: 'Badge ID already in use' });
            }
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const allowedRoles = ['employee', 'manager'];
        const finalRole = allowedRoles.includes(role) ? role : 'employee';
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, department, badge_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, finalRole, department || 'Others', badge_id || null]
        );
        await logSystemActivity(result.insertId, name, finalRole, 'users', 'Created account', `New ${finalRole} account registered.`);
        res.status(201).json({ success: true, message: 'Account created successfully! You can now log in.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
});

// ============================================================
// EMPLOYEE REGISTRATION (Manager only)
// ============================================================
app.post('/api/employees/register', async (req, res) => {
    const { name, email, password, department, badge_id, managerId } = req.body;
    try {
        await validateManagerActivityActor(managerId);
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, department, badge_id) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, department, badge_id || null]
        );
        await logManagerActivity(
            managerId,
            'Registered employee',
            `${name} · ${department || 'Unassigned'} · User #${result.insertId}`
        );
        res.status(201).json({ success: true, message: 'Employee registered successfully' });
    } catch (error) {
        console.error('Employee registration error:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : 'Could not register employee and record manager activity.',
        });
    }
});

// ============================================================
// CHANGE PASSWORD
// ============================================================
app.put('/api/users/:id/change-password', async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const user = users[0];

        // Verify current password (handles both hashed and plain-text for testing)
        const valid = await bcrypt
            .compare(currentPassword, user.password)
            .catch(() => currentPassword === user.password);

        if (!valid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        await logUserSystemActivity(id, 'security', 'Changed password', 'User changed their password.');

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// ============================================================
// MANAGER DASHBOARD
// ============================================================
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const [totalEmp] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "employee"');
        const [clockedIn] = await db.query('SELECT COUNT(*) as count FROM attendance WHERE date = CURDATE() AND status = "Clocked In"');
        const [onBreak] = await db.query('SELECT COUNT(*) as count FROM attendance WHERE date = CURDATE() AND status = "On Break"');
        const absent = totalEmp[0].count - (clockedIn[0].count + onBreak[0].count);
        res.json({
            totalEmployees: totalEmp[0].count,
            clockedIn: clockedIn[0].count,
            onBreak: onBreak[0].count,
            absent: absent > 0 ? absent : 0,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/dashboard/attendance', async (req, res) => {
    try {
        const query = `
            SELECT u.name, COALESCE(a.status, 'Absent') as status,
                   IFNULL(DATE_FORMAT(a.clock_in, '%h:%i %p'), '-') as clockIn,
                   IFNULL(a.total_hours, 0) as hours
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id AND a.date = CURDATE()
            WHERE u.role = 'employee'
        `;
        const [records] = await db.query(query);
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// ALL EMPLOYEES + DEPARTMENT SUMMARY
// ============================================================
app.get('/api/employees/all', async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.name, u.email, u.department, u.badge_id,
                COALESCE(a.status, 'Absent') as status,
                IFNULL(DATE_FORMAT(a.clock_in, '%h:%i %p'), '-') as clockIn,
                IFNULL(DATE_FORMAT(a.clock_out, '%h:%i %p'), '-') as clockOut,
                IFNULL(a.total_hours, 0) as hours
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id AND a.date = CURDATE()
            WHERE u.role = 'employee'
            ORDER BY u.department, u.name
        `;
        const [records] = await db.query(query);
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/departments/summary', async (req, res) => {
    try {
        const query = `
            SELECT u.department,
                COUNT(DISTINCT u.id) as totalEmployees,
                SUM(CASE WHEN a.status = 'Clocked In' THEN 1 ELSE 0 END) as clockedIn,
                SUM(CASE WHEN a.status = 'On Break' THEN 1 ELSE 0 END) as onBreak,
                SUM(CASE WHEN a.status = 'Clocked Out' THEN 1 ELSE 0 END) as clockedOut,
                COUNT(DISTINCT u.id) - SUM(CASE WHEN a.status IN ('Clocked In', 'On Break', 'Clocked Out') THEN 1 ELSE 0 END) as absent
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id AND a.date = CURDATE()
            WHERE u.role = 'employee'
            GROUP BY u.department
            ORDER BY u.department
        `;
        const [records] = await db.query(query);
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// EMPLOYEE DASHBOARD
// ============================================================
app.get('/api/employee/:id/today', async (req, res) => {
    const { id } = req.params;
    try {
        const [records] = await db.query(
            `SELECT COALESCE(status, 'Absent') as status,
                    IFNULL(DATE_FORMAT(clock_in, '%h:%i %p'), '-') as clockIn,
                    IFNULL(total_hours, 0) as totalHours
             FROM attendance WHERE user_id = ? AND date = CURDATE()`,
            [id]
        );
        res.json(records[0] || { status: 'Absent', clockIn: '-', totalHours: 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// CLOCK IN / OUT / BREAK
// ============================================================
app.post('/api/employee/:id/clock-in', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            `INSERT INTO attendance (user_id, date, clock_in, status) 
             VALUES (?, CURDATE(), NOW(), 'Clocked In')
             ON DUPLICATE KEY UPDATE clock_in = NOW(), status = 'Clocked In'`,
            [id]
        );
        await logUserSystemActivity(id, 'attendance', 'Clocked in', 'User clocked in.');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/employee/:id/clock-out', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            `UPDATE attendance SET clock_out = NOW(), status = 'Clocked Out',
             total_hours = TIMESTAMPDIFF(MINUTE, clock_in, NOW())/60
             WHERE user_id = ? AND date = CURDATE()`,
            [id]
        );
        await logUserSystemActivity(id, 'attendance', 'Clocked out', 'User clocked out.');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/employee/:id/break', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            `UPDATE attendance SET status = 'On Break' WHERE user_id = ? AND date = CURDATE()`,
            [id]
        );
        await logUserSystemActivity(id, 'attendance', 'Started break', 'User started a break.');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// BADGE SCAN
// ============================================================
app.post('/api/badge/scan', async (req, res) => {
    const { badge_id } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE badge_id = ?', [badge_id]);
        if (users.length === 0) {
            await logSystemActivity(null, 'System', 'system', 'security', 'Rejected badge scan', 'An unrecognized badge was scanned.');
            return res.status(404).json({ success: false, message: 'Badge not recognized' });
        }
        const user = users[0];
        const [existing] = await db.query(
            'SELECT * FROM attendance WHERE user_id = ? AND date = CURDATE()',
            [user.id]
        );

        if (existing.length === 0) {
            await db.query(
                'INSERT INTO attendance (user_id, date, clock_in, status) VALUES (?, CURDATE(), NOW(), "Clocked In")',
                [user.id]
            );
            await logSystemActivity(user.id, user.name, user.role, 'attendance', 'Badge clock-in', 'Employee clocked in using a badge.');
            return res.json({ success: true, action: 'clocked-in', user: user.name });
        } else if (existing[0].status === 'Clocked In') {
            await db.query(
                'UPDATE attendance SET clock_out = NOW(), status = "Clocked Out", total_hours = TIMESTAMPDIFF(MINUTE, clock_in, NOW())/60 WHERE id = ?',
                [existing[0].id]
            );
            await logSystemActivity(user.id, user.name, user.role, 'attendance', 'Badge clock-out', 'Employee clocked out using a badge.');
            return res.json({ success: true, action: 'clocked-out', user: user.name });
        }
        await logSystemActivity(user.id, user.name, user.role, 'attendance', 'Rejected badge scan', 'Badge scan was rejected because the employee was already clocked out.');
        res.json({ success: false, message: 'Already clocked out today' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// LEAVE REQUESTS
// ============================================================
app.get('/api/leaves', async (req, res) => {
    try {
        const [records] = await db.query(`
            SELECT l.id, u.name as employeeName, l.start_date, l.end_date, l.type, l.reason, l.status
            FROM leave_requests l
            JOIN users u ON l.user_id = u.id
            WHERE l.status = 'Pending'
        `);
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/leaves/employee/:id', async (req, res) => {
    try {
        const [records] = await db.query(`
            SELECT id, start_date, end_date, type, status
            FROM leave_requests WHERE user_id = ?
            ORDER BY created_at DESC
        `, [req.params.id]);
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/leaves', async (req, res) => {
    const { user_id, start_date, end_date, type, reason } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO leave_requests (user_id, start_date, end_date, type, reason) VALUES (?, ?, ?, ?, ?)',
            [user_id, start_date, end_date, type, reason]
        );
        await logUserSystemActivity(
            user_id,
            'leaves',
            'Submitted leave request',
            `Leave request #${result.insertId} submitted (${type}, ${start_date} to ${end_date}).`
        );
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/leaves/:id', async (req, res) => {
    const { id } = req.params;
    const { status, comments, managerId } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Leave status must be Approved or Rejected.' });
    }
    try {
        await validateManagerActivityActor(managerId);
        await db.query(
            'UPDATE leave_requests SET status = ?, manager_comments = ? WHERE id = ?',
            [status, comments || null, id]
        );
        await logManagerActivity(managerId, `${status} leave request`, `Leave request #${id}`, 'leaves');
        res.json({ success: true });
    } catch (error) {
        console.error('Leave decision error:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : 'Could not record leave decision.',
        });
    }
});

// ============================================================
// TIME CARDS (History)
// ============================================================
app.get('/api/timecards/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [records] = await db.query(`
            SELECT date, DATE_FORMAT(date, '%a') as day,
                IFNULL(DATE_FORMAT(clock_in, '%H:%i'), '-') as timeIn,
                IFNULL(DATE_FORMAT(clock_out, '%H:%i'), '-') as timeOut,
                total_hours, status
            FROM attendance WHERE user_id = ?
            ORDER BY date DESC LIMIT 10
        `, [userId]);
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// DIGITAL TIME CARD (Full month)
// ============================================================
app.get('/api/timecard/:userId/:year/:month', async (req, res) => {
    const { userId, year, month } = req.params;
    try {
        const [users] = await db.query(
            'SELECT id, name, department, badge_id FROM users WHERE id = ?',
            [userId]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        const employee = users[0];

        const [records] = await db.query(
            `SELECT DAY(date) as day,
                DATE_FORMAT(clock_in, '%H:%i') as entry_time,
                DATE_FORMAT(clock_out, '%H:%i') as departure_time,
                total_hours, status
            FROM attendance
            WHERE user_id = ? AND YEAR(date) = ? AND MONTH(date) = ?
            ORDER BY date`,
            [userId, year, month]
        );

        const recordMap = {};
        records.forEach(r => { recordMap[r.day] = r; });

        const daysInMonth = new Date(year, month, 0).getDate();
        const days = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const rec = recordMap[d] || {};
            days.push({
                day: d,
                entryTime: rec.entry_time || '',
                departureTime: rec.departure_time || '',
                totalHours: rec.total_hours ? Number(rec.total_hours).toFixed(1) : '',
                signature: rec.status === 'Absent' ? '' : (rec.entry_time ? '✓' : ''),
                supervisorSignature: rec.entry_time ? '✓' : '',
                area: rec.entry_time ? 'A' : '',
            });
        }

        const totalHoursMonth = records.reduce(
            (sum, r) => sum + (Number(r.total_hours) || 0),
            0
        );

        res.json({
            employee,
            year: Number(year),
            month: Number(month),
            monthName: new Date(year, month - 1).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
            }),
            days,
            totalHoursMonth: totalHoursMonth.toFixed(1),
        });
    } catch (error) {
        console.error('Time card error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// REPORTS
// ============================================================
app.post('/api/reports/attendance', async (req, res) => {
    const { startDate, endDate, department, managerId } = req.body;
    try {
        await validateManagerActivityActor(managerId);
        let query = `
            SELECT a.date, u.name as employee, u.department, a.status, a.total_hours as hours
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            WHERE a.date BETWEEN ? AND ?
        `;
        const params = [startDate, endDate];
        if (department && department !== 'All Departments') {
            query += ' AND u.department = ?';
            params.push(department);
        }
        query += ' ORDER BY a.date DESC';
        const [records] = await db.query(query, params);
        await logManagerActivity(
            managerId,
            'Generated attendance report',
            `${startDate} to ${endDate} · ${department || 'All departments'} · ${records.length} rows`,
            'reports'
        );
        res.json(records);
    } catch (error) {
        console.error('Attendance report error:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : 'Could not generate report and record manager activity.',
        });
    }
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS manager_activity_log (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            manager_id BIGINT UNSIGNED NOT NULL,
            manager_name VARCHAR(255) NOT NULL,
            action VARCHAR(100) NOT NULL,
            details VARCHAR(500) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_manager_activity_created (created_at),
            INDEX idx_manager_activity_manager (manager_id, created_at)
        )
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS system_logs (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            actor_id BIGINT UNSIGNED NULL,
            actor_name VARCHAR(255) NOT NULL,
            actor_role VARCHAR(50) NOT NULL,
            category VARCHAR(50) NOT NULL,
            action VARCHAR(120) NOT NULL,
            details VARCHAR(1000) NOT NULL,
            ip_address VARCHAR(45) NULL,
            manager_activity_id BIGINT UNSIGNED NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_system_logs_created (created_at),
            INDEX idx_system_logs_category_created (category, created_at),
            INDEX idx_system_logs_actor_created (actor_id, created_at),
            UNIQUE INDEX uq_system_logs_manager_activity (manager_activity_id)
        )
    `);
    await ensureSystemLogColumn('user_id', 'INT NULL');
    await ensureSystemLogColumn('actor_id', 'BIGINT UNSIGNED NULL');
    await ensureSystemLogColumn("actor_name", "VARCHAR(255) NOT NULL DEFAULT 'System'");
    await ensureSystemLogColumn("actor_role", "VARCHAR(50) NOT NULL DEFAULT 'system'");
    await ensureSystemLogColumn("category", "VARCHAR(50) NOT NULL DEFAULT 'system'");
    await ensureSystemLogColumn("action", "VARCHAR(120) NOT NULL DEFAULT 'Legacy event'");
    await ensureSystemLogColumn("details", "VARCHAR(1000) NOT NULL DEFAULT ''");
    await ensureSystemLogColumn('ip_address', 'VARCHAR(45) NULL');
    await ensureSystemLogColumn('manager_activity_id', 'BIGINT UNSIGNED NULL');
    await ensureSystemLogColumn('created_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
    await ensureSystemLogIndex(
        'idx_system_logs_created',
        'INDEX idx_system_logs_created (created_at)'
    );
    await ensureSystemLogIndex(
        'idx_system_logs_category_created',
        'INDEX idx_system_logs_category_created (category, created_at)'
    );
    await ensureSystemLogIndex(
        'idx_system_logs_actor_created',
        'INDEX idx_system_logs_actor_created (actor_id, created_at)'
    );
    await ensureSystemLogIndex(
        'uq_system_logs_manager_activity',
        'UNIQUE INDEX uq_system_logs_manager_activity (manager_activity_id)'
    );
    await ensureSystemLogForeignKey();
    await db.query(`
        INSERT INTO system_logs
            (user_id, actor_id, actor_name, actor_role, category, action, details, manager_activity_id, created_at)
        SELECT activity.manager_id, activity.manager_id, activity.manager_name,
               COALESCE(users.role, 'manager'),
               CASE
                   WHEN LOWER(activity.action) LIKE '%leave%' THEN 'leaves'
                   WHEN LOWER(activity.action) LIKE '%report%' THEN 'reports'
                   ELSE 'users'
               END,
               activity.action, activity.details, activity.id, activity.created_at
        FROM manager_activity_log AS activity
        LEFT JOIN users ON users.id = activity.manager_id
        WHERE NOT EXISTS (
            SELECT 1 FROM system_logs AS existing
            WHERE existing.manager_activity_id = activity.id
        )
    `);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer().catch((error) => {
    console.error('Server startup failed while ensuring system log schema and data:', error);
    process.exitCode = 1;
});