import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StudentLogin from './components/StudentLogin';
import TypingTest from './components/TypingTest';
import Results from './components/Results';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import CreateTournament from './components/CreateTournament';
import ManageInviteCodes from './components/ManageInviteCodes';
import TournamentResults from './components/TournamentResults';

function App() {
  return (
    <div className="h-screen bg-base flex flex-col">
      <div className="flex-1 overflow-auto pb-16">
        <Routes>
          {/* Student Routes */}
          <Route path="/" element={<StudentLogin />} />
          <Route path="/typing-test" element={<TypingTest />} />
          <Route path="/results" element={<Results />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/create-tournament" element={<CreateTournament />} />
          <Route path="/admin/manage-invite-codes" element={<ManageInviteCodes />} />
          <Route path="/admin/tournament-results" element={<TournamentResults />} />
        </Routes>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-surface0 text-subtext0 text-center py-4 border-t border-surface1 text-sm z-10">
        2025 (c) Haziq Omar of IT Department, Chung Hwa Middle School, Bandar Seri Begawan
      </footer>
    </div>
  );
}

export default App; 