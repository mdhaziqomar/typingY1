# 🏆 Chung Hwa Typing Competition

A modern, real-time typing competition system designed specifically for Chung Hwa Middle School students in Bandar Seri Begawan, Brunei. Built with React, Node.js, MySQL, and featuring the beautiful Catppuccin Mocha theme.

## ✨ Features

### For Students
- **Secure Login**: Students login using unique invite codes
- **1-Minute Typing Challenge**: Timed typing tests with age-appropriate texts
- **Real-time Results**: Live leaderboard updates as students complete challenges
- **Beautiful UI**: Modern interface with Catppuccin Mocha theme
- **Progress Tracking**: Real-time WPM, accuracy, and progress indicators

### For Administrators
- **Tournament Management**: Create and manage multiple typing competitions
- **Invite Code Generation**: Bulk generate unique codes for students
- **Real-time Monitoring**: Watch results come in live
- **Data Export**: Export results to CSV for analysis
- **Comprehensive Dashboard**: Overview of all tournaments and statistics

## 🛠️ Technology Stack

- **Frontend**: React 18, Tailwind CSS, Socket.IO Client
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MySQL
- **Authentication**: JWT tokens
- **Real-time**: Socket.IO for live updates
- **Theme**: Catppuccin Mocha color palette

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- XAMPP (for easy MySQL setup)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd typing-competition
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Database Setup
1. Start XAMPP and ensure MySQL is running
2. Create a new database named `typing_competition` (or use the default)
3. Copy `env.example` to `.env` and configure your database settings:
```bash
cp env.example .env
```

### 4. Environment Configuration
Edit `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=typing_competition
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

### 5. Start the Application
```bash
# Start the backend server
npm run dev

# In a new terminal, start the frontend
npm run client
```

The application will be available at:
- **Student Portal**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

## 👥 Default Admin Credentials

- **Username**: admin
- **Password**: admin123

**⚠️ Important**: Change these credentials in production!

## 📖 Usage Guide

### For Administrators

1. **Login to Admin Panel**
   - Go to http://localhost:3000/admin
   - Use default credentials: admin / admin123

2. **Create a Tournament**
   - Click "Create Tournament" on the dashboard
   - Fill in tournament details (name, description, dates)
   - Save the tournament

3. **Generate Invite Codes**
   - Go to "Manage Invite Codes"
   - Select your tournament
   - Enter student data in format: "Name,Class" (one per line)
   - Click "Generate Codes"

4. **Activate Tournament**
   - Go back to dashboard
   - Set tournament status to "Active"

5. **Monitor Results**
   - View real-time results as students complete challenges
   - Export data to CSV for analysis

### For Students

1. **Access the Competition**
   - Go to http://localhost:3000
   - Enter your invite code (provided by teacher)

2. **Complete the Challenge**
   - Read the instructions
   - Click "Start Challenge" when ready
   - Type the text as accurately and quickly as possible
   - You have exactly 1 minute

3. **View Results**
   - See your personal results immediately
   - View the live leaderboard with all participants

## 🎨 Theme Information

This application uses the **Catppuccin Mocha** color palette, providing:
- Dark, eye-friendly interface
- Consistent color scheme throughout
- Professional appearance suitable for educational use
- High contrast for readability

## 📊 Features in Detail

### Real-time Updates
- Live leaderboard updates via Socket.IO
- Instant result submission
- Real-time tournament status changes

### Security Features
- JWT-based authentication
- Secure invite code system
- One-time use codes prevent cheating
- Admin-only access to sensitive features

### Data Management
- MySQL database for reliable data storage
- CSV export functionality
- Comprehensive result tracking
- Tournament history preservation

### User Experience
- Responsive design for all devices
- Intuitive navigation
- Clear visual feedback
- Accessibility considerations

## 🔧 Development

### Project Structure
```
typing-competition/
├── server.js              # Main server file
├── package.json           # Backend dependencies
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js         # Main app component
│   │   └── index.css      # Tailwind CSS
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # Tailwind configuration
└── README.md
```

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run client     # Start React development server
npm run build      # Build React app for production
```

## 🚀 Deployment

### Production Setup
1. Set up a production MySQL database
2. Configure environment variables for production
3. Build the React app: `npm run build`
4. Set up a reverse proxy (nginx recommended)
5. Use PM2 or similar for process management

### Environment Variables for Production
```env
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-secure-password
DB_NAME=typing_competition
JWT_SECRET=your-very-secure-jwt-secret
PORT=5000
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions:
- Check the documentation above
- Review the code comments
- Contact the development team

## 🎯 Future Enhancements

- [ ] Multiple language support
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Mobile app version
- [ ] Integration with school management systems
- [ ] Custom text passages for different grade levels

---

**Built with ❤️ for Chung Hwa Middle School Students** 

## Deployment to Render

### Prerequisites
- A Render account
- A MySQL database (you can use Render's MySQL service or external providers like PlanetScale, Railway, etc.)

### Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Choose the repository with your typing competition code

3. **Configure the service**
   - **Name**: `typing-competition` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm run deploy-build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if needed)

4. **Set Environment Variables**
   In the Render dashboard, add these environment variables:
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=your-database-host
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_NAME=your-database-name
   JWT_SECRET=your-secret-key
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - The first deployment may take 5-10 minutes

6. **Access your deployed app**
   - Your app will be available at: `https://your-app-name.onrender.com`
   - The URL will be shown in the Render dashboard

### Database Setup for Production

1. **Create a MySQL database** (Render, PlanetScale, Railway, etc.)
2. **Get connection details** (host, user, password, database name)
3. **Set environment variables** in Render dashboard
4. **The database tables will be created automatically** when the app starts

## Default Credentials

- **Admin Login**: 
  - Username: `admin`
  - Password: `admin123`

## API Endpoints

### Admin Routes
- `POST /api/admin/login` - Admin authentication
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments` - Get all tournaments
- `POST /api/invite-codes` - Generate invite codes
- `GET /api/tournaments/:id/results` - Get tournament results

### Student Routes
- `POST /api/student/login` - Student login with invite code
- `POST /api/results` - Submit typing results

## Contributing

This project is developed for Chung Hwa Middle School, Bandar Seri Begawan.

## License

MIT License - see LICENSE file for details.

## Author

Haziq Omar of IT Department, Chung Hwa Middle School, Bandar Seri Begawan 