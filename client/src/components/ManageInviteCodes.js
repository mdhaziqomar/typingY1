import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const ManageInviteCodes = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [inviteCodes, setInviteCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bulkData, setBulkData] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, value: '' });

  useEffect(() => {
    loadTournaments();
    const tournamentId = searchParams.get('tournament');
    if (tournamentId) {
      setSelectedTournament(tournamentId);
      loadInviteCodes(tournamentId);
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

  const loadInviteCodes = async (tournamentId) => {
    if (!tournamentId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/tournaments/${tournamentId}/invite-codes`);
      setInviteCodes(response.data);
    } catch (error) {
      console.error('Error loading invite codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentChange = (e) => {
    const tournamentId = e.target.value;
    setSelectedTournament(tournamentId);
    if (tournamentId) {
      loadInviteCodes(tournamentId);
    } else {
      setInviteCodes([]);
    }
  };

  const handleBulkGenerate = async () => {
    if (!selectedTournament || !bulkData.trim()) {
      setError('Please select a tournament and enter student data');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      // Parse bulk data (format: "Name,Class" per line)
      const lines = bulkData.trim().split('\n');
      const studentData = lines.map(line => {
        const [name, className] = line.split(',').map(s => s.trim());
        return { name, className };
      }).filter(data => data.name && data.className);

      if (studentData.length === 0) {
        setError('No valid student data found. Use format: "Name,Class" per line');
        return;
      }

      const response = await axios.post('/api/invite-codes', {
        tournament_id: selectedTournament,
        student_names: studentData.map(d => d.name),
        student_classes: studentData.map(d => d.className)
      });

      setSuccess(`Generated ${response.data.codes.length} invite codes successfully!`);
      setBulkData('');
      loadInviteCodes(selectedTournament);
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const exportToCSV = () => {
    const csvContent = [
      'Code,Student Name,Class,Used,Created At',
      ...inviteCodes.map(code => 
        `${code.code},"${code.student_name}","${code.student_class}",${code.is_used ? 'Yes' : 'No'},"${new Date(code.created_at).toLocaleString()}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invite-codes-${selectedTournament}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const deleteInviteCode = (id) => {
    setDeleteDialog({ open: true, id, value: '' });
  };

  const confirmDeleteInviteCode = async () => {
    if (deleteDialog.value !== 'Delete') return;
    try {
      await axios.delete(`/api/invite-codes/${deleteDialog.id}`);
      setDeleteDialog({ open: false, id: null, value: '' });
      loadInviteCodes(selectedTournament);
    } catch (error) {
      alert('Failed to delete invite code');
    }
  };

  return (
    <div className="bg-gradient-to-br from-base via-mantle to-crust p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">
            🎫 Manage Invite Codes
          </h1>
          <p className="text-subtext0">
            Generate and manage student invite codes for tournaments
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
            {/* Bulk Generation */}
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-text mb-4">Generate Invite Codes</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-text mb-2">
                  Student Data (One per line, format: "Name,Class")
                </label>
                <textarea
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  className="input-field w-full h-32 resize-none font-mono"
                  placeholder="John Doe,Class 7A&#10;Jane Smith,Class 7B&#10;Mike Johnson,Class 8A"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleBulkGenerate}
                  disabled={generating || !bulkData.trim()}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-crust mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    'Generate Codes'
                  )}
                </button>
                
                <button
                  onClick={() => setBulkData('')}
                  className="btn-secondary px-6 py-2"
                >
                  Clear
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red bg-opacity-20 border border-red text-red px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 bg-green bg-opacity-20 border border-green text-green px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}
            </div>

            {/* Invite Codes List */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-text">
                  Invite Codes ({inviteCodes.length})
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={exportToCSV}
                    disabled={inviteCodes.length === 0}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue mx-auto mb-4"></div>
                  <p className="text-subtext0">Loading invite codes...</p>
                </div>
              ) : inviteCodes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎫</div>
                  <h3 className="text-lg font-semibold text-text mb-2">No Invite Codes Yet</h3>
                  <p className="text-subtext0">Generate some invite codes above to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface1">
                        <th className="text-left py-4 px-6 text-subtext0 font-semibold">Code</th>
                        <th className="text-left py-4 px-6 text-subtext0 font-semibold">Student Name</th>
                        <th className="text-left py-4 px-6 text-subtext0 font-semibold">Class</th>
                        <th className="text-center py-4 px-6 text-subtext0 font-semibold">Status</th>
                        <th className="text-center py-4 px-6 text-subtext0 font-semibold">Created</th>
                        <th className="text-center py-4 px-6 text-subtext0 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inviteCodes.map((code) => (
                        <tr key={code.id} className="border-b border-surface1 hover:bg-surface1 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-mono text-blue font-semibold">{code.code}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-text font-semibold">{code.student_name}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-subtext0">{code.student_class}</div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              code.is_used 
                                ? 'bg-red bg-opacity-20 text-red' 
                                : 'bg-green bg-opacity-20 text-green'
                            }`}>
                              {code.is_used ? 'Used' : 'Available'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="text-subtext0 text-sm">
                              {code.created_at}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => copyToClipboard(code.code)}
                              className="btn-secondary px-3 py-1 text-sm mr-2"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => deleteInviteCode(code.id)}
                              className="btn-danger px-3 py-1 text-sm"
                            >
                              Delete
                            </button>
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

      {deleteDialog.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-surface0 p-8 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold text-red mb-4">Delete Invite Code</h2>
            <p className="mb-4 text-subtext0">Type <span className="font-bold text-red">Delete</span> to confirm deletion. This action cannot be undone.</p>
            <input
              type="text"
              value={deleteDialog.value}
              onChange={e => setDeleteDialog({ ...deleteDialog, value: e.target.value })}
              className="input-field w-full mb-4"
              placeholder="Type Delete to confirm"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteDialog({ open: false, id: null, value: '' })}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteInviteCode}
                className="btn-danger px-4 py-2"
                disabled={deleteDialog.value !== 'Delete'}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInviteCodes; 