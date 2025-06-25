import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const Results = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io();
    setSocket(newSocket);

    // Join tournament room
    const tournamentId = localStorage.getItem('tournamentId');
    if (tournamentId) {
      newSocket.emit('join-tournament', tournamentId);
    }

    // Listen for new results
    newSocket.on('new-result', (result) => {
      setResults(prev => {
        const newResults = [...prev, result];
        return newResults.sort((a, b) => b.wpm - a.wpm);
      });
    });

    // Load existing results
    loadResults();

    return () => {
      newSocket.close();
    };
  }, []);

  const loadResults = async () => {
    try {
      const token = localStorage.getItem('studentToken');
      if (!token) {
        navigate('/');
        return;
      }

      // Get tournament ID from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const tournamentId = payload.tournament_id;
      localStorage.setItem('tournamentId', tournamentId);

      const response = await axios.get(`/api/tournaments/${tournamentId}/results`);
      setResults(response.data);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getWpmColor = (wpm) => {
    if (wpm >= 60) return 'text-green';
    if (wpm >= 40) return 'text-blue';
    if (wpm >= 20) return 'text-yellow';
    return 'text-red';
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 95) return 'text-green';
    if (accuracy >= 85) return 'text-blue';
    if (accuracy >= 70) return 'text-yellow';
    return 'text-red';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-base via-mantle to-crust">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto mb-4"></div>
          <p className="text-subtext0">Loading results...</p>
        </div>
      </div>
    );
  }

  // Filter valid results for summary stats (accept string or number)
  const validWpmResults = results.filter(r => !isNaN(Number(r.wpm)));
  const validAccuracyResults = results.filter(r => !isNaN(Number(r.accuracy)));

  const avgWpm = validWpmResults.length === 0
    ? 0
    : Math.round(validWpmResults.reduce((sum, r) => sum + Number(r.wpm), 0) / validWpmResults.length);

  const avgAccuracy = validAccuracyResults.length === 0
    ? 0
    : Math.round(validAccuracyResults.reduce((sum, r) => sum + Number(r.accuracy), 0) / validAccuracyResults.length);

  const highestWpm = validWpmResults.length === 0
    ? 0
    : Math.max(...validWpmResults.map(r => Number(r.wpm)));

  return (
    <div className="bg-gradient-to-br from-base via-mantle to-crust p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text mb-2">
            🏆 Tournament Results
          </h1>
          <p className="text-subtext0 text-lg">
            {localStorage.getItem('tournamentName')} - Live Leaderboard
          </p>
          <p className="text-subtext0">
            Results update in real-time as students complete their typing challenges
          </p>
        </div>

        {/* Live Indicator */}
        <div className="card mb-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-green rounded-full animate-pulse"></div>
            <span className="text-green font-semibold">LIVE</span>
            <span className="text-subtext0">- Results are updating in real-time</span>
          </div>
        </div>

        {/* Results Table */}
        {results.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⌨️</div>
            <h2 className="text-2xl font-bold text-text mb-2">No Results Yet</h2>
            <p className="text-subtext0 mb-6">
              Students are still completing their typing challenges.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary px-6 py-2"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface1">
                    <th className="text-left py-4 px-6 text-subtext0 font-semibold">Rank</th>
                    <th className="text-left py-4 px-6 text-subtext0 font-semibold">Student</th>
                    <th className="text-left py-4 px-6 text-subtext0 font-semibold">Class</th>
                    <th className="text-center py-4 px-6 text-subtext0 font-semibold">WPM</th>
                    <th className="text-center py-4 px-6 text-subtext0 font-semibold">Accuracy</th>
                    <th className="text-center py-4 px-6 text-subtext0 font-semibold">Words</th>
                    <th className="text-center py-4 px-6 text-subtext0 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr 
                      key={result.id} 
                      className={`border-b border-surface1 hover:bg-surface1 transition-colors ${
                        index < 3 ? 'bg-surface1 bg-opacity-50' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{getRankIcon(index + 1)}</span>
                          <span className="text-text font-semibold">{index + 1}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-text font-semibold">
                          {result.student_name}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-subtext0">
                          {result.student_class}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className={`text-xl font-bold ${getWpmColor(result.wpm)}`}>
                          {result.wpm}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className={`text-lg font-semibold ${getAccuracyColor(result.accuracy)}`}>
                          {result.accuracy}%
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="text-text">
                          {result.correct_words}/{result.total_words}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="text-subtext0">
                          {Math.floor(result.time_taken / 60)}:{(result.time_taken % 60).toString().padStart(2, '0')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            <div className="mt-8 pt-6 border-t border-surface1">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-text">{results.length}</div>
                  <div className="text-subtext0">Total Participants</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green">
                    {avgWpm}
                  </div>
                  <div className="text-subtext0">Average WPM</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue">
                    {avgAccuracy}%
                  </div>
                  <div className="text-subtext0">Average Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-peach">
                    {highestWpm}
                  </div>
                  <div className="text-subtext0">Highest WPM</div>
                </div>
              </div>
            </div>
          </>
        )}
        {/* Action Buttons */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary px-8 py-3 text-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results; 