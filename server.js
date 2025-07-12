const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const path = require('path');

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

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
} else {
  app.use(express.static('public'));
}

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'typing_competition',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create database connection pool
const pool = new Pool(dbConfig);

// Initialize database tables
async function initializeDatabase() {
  try {
    const connection = await pool.connect();
    
    // Create tournaments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
        typing_text TEXT,
        timer_duration INTEGER DEFAULT 60,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create invite_codes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invite_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        tournament_id INTEGER,
        student_name VARCHAR(255),
        student_class VARCHAR(100),
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
      )
    `);
    
    // Create results table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        invite_code_id INTEGER,
        tournament_id INTEGER,
        student_name VARCHAR(255),
        student_class VARCHAR(100),
        wpm DECIMAL(5,2),
        accuracy DECIMAL(5,2),
        total_words INTEGER,
        correct_words INTEGER,
        time_taken INTEGER,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invite_code_id) REFERENCES invite_codes(id),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
      )
    `);
    
    // Create admin table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default admin if not exists
    const { rows } = await connection.query('SELECT * FROM admins WHERE username = $1', ['admin']);
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', ['admin', hashedPassword]);
    }
    
    // Add timer_duration column if it doesn't exist
    try {
      await connection.query('ALTER TABLE tournaments ADD COLUMN timer_duration INTEGER DEFAULT 60');
      console.log('Added timer_duration column to tournaments table');
    } catch (error) {
      // Column already exists, ignore error
      console.log('timer_duration column already exists');
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
    const { rows } = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    
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
    const { name, description, start_date, end_date, typing_text, timer_duration } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO tournaments (name, description, start_date, end_date, typing_text, timer_duration) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [name, description, start_date, end_date, typing_text, timer_duration || 60]
    );
    res.json({ id: rows[0].id, message: 'Tournament created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all tournaments
app.get('/api/tournaments', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tournaments ORDER BY created_at DESC');
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
    const { rows } = await pool.query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
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

// Update tournament details
app.put('/api/tournaments/:id', async (req, res) => {
  try {
    const { name, description, start_date, end_date, typing_text, timer_duration } = req.body;
    const { id } = req.params;
    
    console.log('Updating tournament:', id, { name, description, start_date, end_date, typing_text, timer_duration });
    
    await pool.query(
      'UPDATE tournaments SET name = $1, description = $2, start_date = $3, end_date = $4, typing_text = $5, timer_duration = $6 WHERE id = $7',
      [name, description, start_date, end_date, typing_text, timer_duration || 60, id]
    );
    
    res.json({ message: 'Tournament updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
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
      await pool.query(
        'INSERT INTO invite_codes (code, tournament_id, student_name, student_class) VALUES ($1, $2, $3, $4)',
        [code, tournament_id, student_names[i], student_classes[i]]
      );
      codes.push({ code, student_name: student_names[i], student_class: student_classes[i] });
    }
    
    res.json({ codes, message: 'Invite codes created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a custom invite code
app.post('/api/invite-codes/custom', async (req, res) => {
  try {
    const { tournament_id, code } = req.body;

    if (!tournament_id || !code) {
      return res.status(400).json({ error: 'tournament_id and code are required' });
    }

    const trimmedCode = String(code).trim().toUpperCase();

    // Basic validation – at least 4 characters alphanumeric
    if (!/^[A-Z0-9]{4,20}$/.test(trimmedCode)) {
      return res.status(400).json({ error: 'Code must be 4-20 alphanumeric characters' });
    }

    // Check if code already exists
    const existing = await pool.query('SELECT id FROM invite_codes WHERE code = $1', [trimmedCode]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Code already exists' });
    }

    await pool.query(
      'INSERT INTO invite_codes (code, tournament_id) VALUES ($1, $2)',
      [trimmedCode, tournament_id]
    );

    res.json({ code: trimmedCode, message: 'Custom invite code created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get invite codes for a tournament
app.get('/api/tournaments/:id/invite-codes', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM invite_codes WHERE tournament_id = $1 ORDER BY created_at DESC',
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

// Student login with invite code (reusable codes)
app.post('/api/student/login', async (req, res) => {
  try {
    const { code, student_name, student_class } = req.body;

    if (!student_name || !student_class) {
      return res.status(400).json({ error: 'Student name and class are required' });
    }

    const { rows } = await pool.query(
      'SELECT ic.*, t.name as tournament_name, t.status as tournament_status FROM invite_codes ic JOIN tournaments t ON ic.tournament_id = t.id WHERE ic.code = $1',
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const inviteCode = rows[0];

    if (inviteCode.tournament_status !== 'active') {
      return res.status(400).json({ error: 'Tournament is not active' });
    }

    const token = jwt.sign(
      {
        invite_code_id: inviteCode.id,
        student_name,
        student_class,
        tournament_id: inviteCode.tournament_id
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '2h' }
    );

    res.json({
      token,
      student_name,
      student_class,
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
    
    // Mark invite code as used (for tracking; code remains reusable)
    await pool.query('UPDATE invite_codes SET is_used = TRUE WHERE id = $1', [decoded.invite_code_id]);

    // Insert result
    const { rows } = await pool.query(
      'INSERT INTO results (invite_code_id, tournament_id, student_name, student_class, wpm, accuracy, total_words, correct_words, time_taken) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
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
    const { rows } = await pool.query(
      'SELECT * FROM results WHERE tournament_id = $1 ORDER BY wpm DESC, accuracy DESC',
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
    await pool.query('UPDATE tournaments SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'Tournament status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete invite code
app.delete('/api/invite-codes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM invite_codes WHERE id = $1', [id]);
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
    await pool.query('DELETE FROM results WHERE tournament_id = $1', [id]);
    // Delete invite codes
    await pool.query('DELETE FROM invite_codes WHERE tournament_id = $1', [id]);
    // Delete tournament
    await pool.query('DELETE FROM tournaments WHERE id = $1', [id]);
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

// Catch-all handler for React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 