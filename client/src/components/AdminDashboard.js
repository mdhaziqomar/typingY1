import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, value: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await axios.get('/api/tournaments');
      setTournaments(response.data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/tournaments/${id}/status`, { status });
      loadTournaments();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const deleteTournament = async (id) => {
    setDeleteDialog({ open: true, id, value: '' });
  };

  const confirmDeleteTournament = async () => {
    if (deleteDialog.value !== 'Delete') return;
    try {
      await axios.delete(`/api/tournaments/${deleteDialog.id}`);
      setDeleteDialog({ open: false, id: null, value: '' });
      loadTournaments();
    } catch (error) {
      alert('Failed to delete tournament');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green';
      case 'upcoming':
        return 'text-blue';
      case 'completed':
        return 'text-subtext0';
      default:
        return 'text-subtext0';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'upcoming':
        return '🔵';
      case 'completed':
        return '⚪';
      default:
        return '⚪';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-base via-mantle to-crust">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto mb-4"></div>
          <p className="text-subtext0">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-base via-mantle to-crust">
      {/* Header */}
      <div className="bg-surface0 border-b border-surface1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-text">
                🛡️ Admin Dashboard
              </h1>
              <p className="text-subtext0">
                Welcome back, {localStorage.getItem('adminUsername')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-danger px-4 py-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card text-center hover:bg-surface1 transition-colors cursor-pointer" onClick={() => navigate('/admin/create-tournament')}>
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-semibold text-text mb-2">Create Tournament</h3>
            <p className="text-subtext0 text-sm">Set up a new typing competition</p>
          </div>
          
          <div className="card text-center hover:bg-surface1 transition-colors cursor-pointer" onClick={() => navigate('/admin/manage-invite-codes')}>
            <div className="text-4xl mb-4">🎫</div>
            <h3 className="text-lg font-semibold text-text mb-2">Manage Invite Codes</h3>
            <p className="text-subtext0 text-sm">Generate and manage student codes</p>
          </div>
          
          <div className="card text-center hover:bg-surface1 transition-colors cursor-pointer" onClick={() => navigate('/admin/tournament-results')}>
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-text mb-2">View Results</h3>
            <p className="text-subtext0 text-sm">Check competition results</p>
          </div>
          
          <div className="card text-center hover:bg-surface1 transition-colors cursor-pointer" onClick={() => navigate('/')}>
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-text mb-2">Student Portal</h3>
            <p className="text-subtext0 text-sm">Go to student login page</p>
          </div>
        </div>

        {/* Tournaments Overview */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text">Tournaments</h2>
            <button
              onClick={() => navigate('/admin/create-tournament')}
              className="btn-primary px-4 py-2"
            >
              Create New
            </button>
          </div>

          {tournaments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-text mb-2">No Tournaments Yet</h3>
              <p className="text-subtext0 mb-6">
                Create your first tournament to get started!
              </p>
              <button
                onClick={() => navigate('/admin/create-tournament')}
                className="btn-primary px-6 py-2"
              >
                Create Tournament
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface1">
                    <th className="text-left py-4 px-6 text-subtext0 font-semibold">Name</th>
                    <th className="text-left py-4 px-6 text-subtext0 font-semibold">Status</th>
                    <th className="text-left py-4 px-6 text-subtext0 font-semibold">Start Date</th>
                    <th className="text-left py-4 px-6 text-subtext0 font-semibold">End Date</th>
                    <th className="text-center py-4 px-6 text-subtext0 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((tournament) => (
                    <tr key={tournament.id} className="border-b border-surface1 hover:bg-surface1 transition-colors">
                      <td className="py-4 px-6">
                        <div className="text-text font-semibold">{tournament.name}</div>
                        {tournament.description && (
                          <div className="text-subtext0 text-sm mt-1">{tournament.description}</div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <span className="mr-2">{getStatusIcon(tournament.status)}</span>
                          <span className={`font-semibold ${getStatusColor(tournament.status)}`}>
                            {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-subtext0">
                          {tournament.start_date || 'Not set'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-subtext0">
                          {tournament.end_date || 'Not set'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex space-x-2 justify-center">
                          <button
                            onClick={() => navigate(`/admin/tournament-results?tournament=${tournament.id}`)}
                            className="btn-secondary px-3 py-1 text-sm"
                          >
                            Results
                          </button>
                          <button
                            onClick={() => navigate(`/admin/manage-invite-codes?tournament=${tournament.id}`)}
                            className="btn-primary px-3 py-1 text-sm"
                          >
                            Codes
                          </button>
                          {tournament.status !== 'completed' && (
                            <button
                              onClick={() => updateStatus(tournament.id, tournament.status === 'active' ? 'upcoming' : 'active')}
                              className={`px-3 py-1 text-sm rounded-lg font-semibold ${tournament.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                            >
                              {tournament.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                          <button
                            onClick={() => deleteTournament(tournament.id)}
                            className="btn-danger px-3 py-1 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-2xl font-bold text-green mb-2">{tournaments.filter(t => t.status === 'active').length}</div>
            <div className="text-subtext0">Active Tournaments</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue mb-2">{tournaments.filter(t => t.status === 'upcoming').length}</div>
            <div className="text-subtext0">Upcoming Tournaments</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-subtext0 mb-2">{tournaments.filter(t => t.status === 'completed').length}</div>
            <div className="text-subtext0">Completed Tournaments</div>
          </div>
        </div>
      </div>

      {deleteDialog.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-surface0 p-8 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold text-red mb-4">Delete Tournament</h2>
            <p className="mb-4 text-subtext0">Type <span className="font-bold text-red">Delete</span> to confirm deletion. This will remove the tournament, all invite codes, and all results. This action cannot be undone.</p>
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
                onClick={confirmDeleteTournament}
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

export default AdminDashboard; 