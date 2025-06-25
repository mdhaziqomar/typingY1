const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'typing_competition',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00' // Asia/Brunei
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database tables
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await connection.query(`USE \`${dbConfig.database}\``);
    
    // Create tournaments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATETIME,
        end_date DATETIME,
        status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
        typing_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create invite_codes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS invite_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        tournament_id INT,
        student_name VARCHAR(255),
        student_class VARCHAR(100),
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
      )
    `);
    
    // Create results table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invite_code_id INT,
        tournament_id INT,
        student_name VARCHAR(255),
        student_class VARCHAR(100),
        wpm DECIMAL(5,2),
        accuracy DECIMAL(5,2),
        total_words INT,
        correct_words INT,
        time_taken INT,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invite_code_id) REFERENCES invite_codes(id),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
      )
    `);
    
    // Create admin table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default admin if not exists
    const [adminRows] = await connection.execute('SELECT * FROM admins WHERE username = ?', ['admin']);
    if (adminRows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.execute('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hashedPassword]);
    }
    
    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Initialize database on startup
initializeDatabase();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-tournament', (tournamentId) => {
    socket.join(`tournament-${tournamentId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes

// Admin authentication
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM admins WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const admin = rows[0];
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    res.json({ token, username: admin.username });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create tournament
app.post('/api/tournaments', async (req, res) => {
  try {
    const { name, description, start_date, end_date, typing_text } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO tournaments (name, description, start_date, end_date, typing_text) VALUES (?, ?, ?, ?, ?)',
      [name, description, start_date, end_date, typing_text]
    );
    res.json({ id: result.insertId, message: 'Tournament created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all tournaments
app.get('/api/tournaments', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM tournaments ORDER BY created_at DESC');
    // Format start_date, end_date, created_at
    const formatted = rows.map(row => ({
      ...row,
      start_date: formatDate(row.start_date),
      end_date: formatDate(row.end_date),
      created_at: formatDate(row.created_at)
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get tournament details (add if not exists)
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM tournaments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tournament not found' });
    const row = rows[0];
    res.json({
      ...row,
      start_date: formatDate(row.start_date),
      end_date: formatDate(row.end_date),
      created_at: formatDate(row.created_at)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create invite codes
app.post('/api/invite-codes', async (req, res) => {
  try {
    const { tournament_id, student_names, student_classes } = req.body;
    const codes = [];
    
    for (let i = 0; i < student_names.length; i++) {
      const code = uuidv4().substring(0, 8).toUpperCase();
      await pool.execute(
        'INSERT INTO invite_codes (code, tournament_id, student_name, student_class) VALUES (?, ?, ?, ?)',
        [code, tournament_id, student_names[i], student_classes[i]]
      );
      codes.push({ code, student_name: student_names[i], student_class: student_classes[i] });
    }
    
    res.json({ codes, message: 'Invite codes created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get invite codes for a tournament
app.get('/api/tournaments/:id/invite-codes', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM invite_codes WHERE tournament_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    // Format created_at
    const formatted = rows.map(row => ({
      ...row,
      created_at: formatDate(row.created_at)
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Student login with invite code
app.post('/api/student/login', async (req, res) => {
  try {
    const { code } = req.body;
    const [rows] = await pool.execute(
      'SELECT ic.*, t.name as tournament_name, t.status as tournament_status FROM invite_codes ic JOIN tournaments t ON ic.tournament_id = t.id WHERE ic.code = ?',
      [code]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }
    
    const inviteCode = rows[0];
    
    if (inviteCode.is_used) {
      return res.status(400).json({ error: 'This invite code has already been used' });
    }
    
    if (inviteCode.tournament_status !== 'active') {
      return res.status(400).json({ error: 'Tournament is not active' });
    }
    
    const token = jwt.sign(
      { 
        invite_code_id: inviteCode.id, 
        student_name: inviteCode.student_name,
        student_class: inviteCode.student_class,
        tournament_id: inviteCode.tournament_id 
      }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '2h' }
    );
    
    res.json({ 
      token, 
      student_name: inviteCode.student_name,
      student_class: inviteCode.student_class,
      tournament_name: inviteCode.tournament_name
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit typing result
app.post('/api/results', async (req, res) => {
  try {
    const { wpm, accuracy, total_words, correct_words, time_taken } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Mark invite code as used
    await pool.execute('UPDATE invite_codes SET is_used = TRUE WHERE id = ?', [decoded.invite_code_id]);
    
    // Insert result
    const [result] = await pool.execute(
      'INSERT INTO results (invite_code_id, tournament_id, student_name, student_class, wpm, accuracy, total_words, correct_words, time_taken) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [decoded.invite_code_id, decoded.tournament_id, decoded.student_name, decoded.student_class, wpm, accuracy, total_words, correct_words, time_taken]
    );
    
    // Emit real-time update
    io.to(`tournament-${decoded.tournament_id}`).emit('new-result', {
      student_name: decoded.student_name,
      student_class: decoded.student_class,
      wpm,
      accuracy,
      total_words,
      correct_words
    });
    
    res.json({ message: 'Result submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get tournament results
app.get('/api/tournaments/:id/results', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM results WHERE tournament_id = ? ORDER BY wpm DESC, accuracy DESC',
      [req.params.id]
    );
    // Format completed_at
    const formatted = rows.map(row => ({
      ...row,
      completed_at: formatDate(row.completed_at)
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update tournament status
app.put('/api/tournaments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.execute('UPDATE tournaments SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Tournament status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete invite code
app.delete('/api/invite-codes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM invite_codes WHERE id = ?', [id]);
    res.json({ message: 'Invite code deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete tournament and cascade delete invite codes and results
app.delete('/api/tournaments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Delete results first
    await pool.execute('DELETE FROM results WHERE tournament_id = ?', [id]);
    // Delete invite codes
    await pool.execute('DELETE FROM invite_codes WHERE tournament_id = ?', [id]);
    // Delete tournament
    await pool.execute('DELETE FROM tournaments WHERE id = ?', [id]);
    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper to format date as dd/mm/yyyy
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 