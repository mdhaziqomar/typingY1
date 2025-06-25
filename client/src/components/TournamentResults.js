import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const TournamentResults = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadTournaments();
    const tournamentId = searchParams.get('tournament');
    if (tournamentId) {
      setSelectedTournament(tournamentId);
      loadResults(tournamentId);
    }
  }, [searchParams]);

  const loadTournaments = async () => {
    try {
      const response = await axios.get('/api/tournaments');
      setTournaments(response.data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    }
  };

  const loadResults = async (tournamentId) => {
    if (!tournamentId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/tournaments/${tournamentId}/results`);
      setResults(response.data);
    } catch (error) {
      console.error('Error loading results:', error);
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentChange = (e) => {
    const tournamentId = e.target.value;
    setSelectedTournament(tournamentId);
    if (tournamentId) {
      loadResults(tournamentId);
    } else {
      setResults([]);
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
    const wpmNum = Number(wpm);
    if (wpmNum >= 60) return 'text-green';
    if (wpmNum >= 40) return 'text-blue';
    if (wpmNum >= 20) return 'text-yellow';
    return 'text-red';
  };

  const getAccuracyColor = (accuracy) => {
    const accuracyNum = Number(accuracy);
    if (accuracyNum >= 95) return 'text-green';
    if (accuracyNum >= 85) return 'text-blue';
    if (accuracyNum >= 70) return 'text-yellow';
    return 'text-red';
  };

  const exportToCSV = () => {
    const tournament = tournaments.find(t => t.id == selectedTournament);
    const csvContent = [
      'Rank,Student Name,Class,WPM,Accuracy,Correct Words,Total Words,Time Taken,Completed At',
      ...results.map((result, index) => 
        `${index + 1},"${result.student_name}","${result.student_class}",${result.wpm},${result.accuracy},${result.correct_words},${result.total_words},${result.time_taken},"${new Date(result.completed_at).toLocaleString()}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-results-${selectedTournament}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateStats = () => {
    if (results.length === 0) return null;

    // Filter valid results and convert to numbers
    const validResults = results.filter(r => 
      r.wpm !== null && r.wpm !== undefined && r.accuracy !== null && r.accuracy !== undefined
    );

    if (validResults.length === 0) return null;

    const avgWpm = Math.round(
      validResults.reduce((sum, r) => sum + Number(r.wpm), 0) / validResults.length
    );
    const avgAccuracy = Math.round(
      validResults.reduce((sum, r) => sum + Number(r.accuracy), 0) / validResults.length
    );
    const maxWpm = Math.max(...validResults.map(r => Number(r.wpm)));
    const minWpm = Math.min(...validResults.map(r => Number(r.wpm)));
    const totalParticipants = results.length;

    return { avgWpm, avgAccuracy, maxWpm, minWpm, totalParticipants };
  };

  const stats = calculateStats();

  return (
    <div className="bg-gradient-to-br from-base via-mantle to-crust p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">
            📊 Tournament Results
          </h1>
          <p className="text-subtext0">
            View detailed results and statistics for typing competitions
          </p>
        </div>

        {/* Tournament Selection */}
        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="tournament" className="text-sm font-medium text-text">
              Select Tournament:
            </label>
            <select
              id="tournament"
              value={selectedTournament}
              onChange={handleTournamentChange}
              className="input-field flex-1"
            >
              <option value="">Choose a tournament...</option>
              {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name} ({tournament.status})
                </option>
              ))}
            </select>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="btn-secondary px-4 py-2"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {selectedTournament && (
          <>
            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                <div className="card text-center">
                  <div className="text-2xl font-bold text-text mb-2">{stats.totalParticipants}</div>
                  <div className="text-subtext0">Total Participants</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-green mb-2">{stats.avgWpm}</div>
                  <div className="text-subtext0">Average WPM</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-blue mb-2">{stats.avgAccuracy}%</div>
                  <div className="text-subtext0">Average Accuracy</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-peach mb-2">{stats.maxWpm}</div>
                  <div className="text-subtext0">Highest WPM</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-yellow mb-2">{stats.minWpm}</div>
                  <div className="text-subtext0">Lowest WPM</div>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-text">
                  Results ({results.length} participants)
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={exportToCSV}
                    disabled={results.length === 0}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue mx-auto mb-4"></div>
                  <p className="text-subtext0">Loading results...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-red mb-4">{error}</div>
                  <button
                    onClick={() => loadResults(selectedTournament)}
                    className="btn-primary px-4 py-2"
                  >
                    Retry
                  </button>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-text mb-2">No Results Yet</h3>
                  <p className="text-subtext0">Students haven't completed this tournament yet.</p>
                </div>
              ) : (
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
                        <th className="text-center py-4 px-6 text-subtext0 font-semibold">Completed</th>
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
                          <td className="py-4 px-6 text-center">
                            <div className="text-subtext0 text-sm">
                              {result.completed_at}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TournamentResults; 