const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log('🏆 Chung Hwa Typing Competition Setup\n');
  console.log('This script will help you configure the database and environment.\n');

  try {
    // Install dependencies first
    console.log('Installing backend dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    console.log('Installing frontend dependencies...');
    execSync('cd client && npm install', { stdio: 'inherit' });

    // Now we can use mysql2
    const mysql = require('mysql2/promise');

    // Get database configuration
    const dbHost = await question('Database host (default: localhost): ') || 'localhost';
    const dbUser = await question('Database user (default: root): ') || 'root';
    const dbPassword = await question('Database password (press Enter if none): ');
    const dbName = await question('Database name (default: typing_competition): ') || 'typing_competition';
    
    // Test database connection
    console.log('\nTesting database connection...');
    const connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword
    });

    // Use .query() for CREATE DATABASE and USE
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    
    // Add typing_text column to tournaments if not exists
    await connection.query(`ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS typing_text TEXT`);
    
    console.log('✅ Database connection successful!');
    console.log('✅ Database created/verified successfully!');

    // Generate JWT secret
    const jwtSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Create .env file
    const envContent = `# Database Configuration\nDB_HOST=${dbHost}\nDB_USER=${dbUser}\nDB_PASSWORD=${dbPassword}\nDB_NAME=${dbName}\n\n# JWT Secret (change this in production!)\nJWT_SECRET=${jwtSecret}\n\n# Server Port\nPORT=5000\n`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ Environment file (.env) created successfully!');

    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend: npm run client');
    console.log('3. Access the application at http://localhost:3000');
    console.log('4. Admin panel: http://localhost:3000/admin (admin/admin123)');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\nPlease check your database configuration and try again.');
  } finally {
    rl.close();
  }
}

setup(); 