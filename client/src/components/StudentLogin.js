import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentLogin = () => {
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/student/login', {
        code: inviteCode,
        student_name: studentName,
        student_class: studentClass
      });
      localStorage.setItem('studentToken', response.data.token);
      localStorage.setItem('studentName', response.data.student_name);
      localStorage.setItem('studentClass', response.data.student_class);
      localStorage.setItem('tournamentName', response.data.tournament_name);
      navigate('/typing-test');
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-base via-mantle to-crust">
      <div className="card max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">
            Chung Hwa Middle School BSB<br></br>Typing Competition
          </h1>
          <p className="text-subtext0">
            Enter your invite code to start the typing challenge
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="studentName" className="block text-sm font-medium text-text mb-2">
              Student Name
            </label>
            <input
              type="text"
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="input-field w-full text-center text-lg"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label htmlFor="studentClass" className="block text-sm font-medium text-text mb-2">
              Class
            </label>
            <input
              type="text"
              id="studentClass"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              className="input-field w-full text-center text-lg"
              placeholder="E.g. 7A"
              required
            />
          </div>

          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-text mb-2">
              Invite Code
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="input-field w-full text-center text-xl tracking-widest font-mono"
              placeholder="ENTER CODE"
              maxLength={8}
              required
            />
          </div>

          {error && (
            <div className="bg-red bg-opacity-20 border border-red text-red px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !inviteCode || !studentName.trim() || !studentClass.trim()}
            className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-crust mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Start Typing Challenge'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-subtext0 text-sm">
            Need help? Contact your teacher for an invite code.
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/admin')}
            className="text-blue hover:text-sapphire text-sm underline"
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin; 