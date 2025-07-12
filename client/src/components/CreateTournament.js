import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateTournament = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    typing_text: '',
    timer_duration: 60
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/tournaments', formData);
      setSuccess('Tournament created successfully!');
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-base via-mantle to-crust p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">
            🏆 Create New Tournament
          </h1>
          <p className="text-subtext0">
            Set up a new typing competition for Chung Hwa students
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                Tournament Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="e.g., Spring 2024 Typing Championship"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field w-full h-24 resize-none"
                placeholder="Describe the tournament, rules, prizes, etc."
                rows="4"
              />
            </div>

            <div>
              <label htmlFor="typing_text" className="block text-sm font-medium text-text mb-2">
                Typing Passage *
              </label>
              <textarea
                id="typing_text"
                name="typing_text"
                value={formData.typing_text}
                onChange={handleChange}
                className="input-field w-full h-32 resize-none font-mono"
                placeholder="Enter the passage students will type..."
                required
                rows="6"
              />
            </div>

            <div>
              <label htmlFor="timer_duration" className="block text-sm font-medium text-text mb-2">
                Timer Duration
              </label>
              <select
                id="timer_duration"
                name="timer_duration"
                value={formData.timer_duration}
                onChange={handleChange}
                className="input-field w-full"
              >
                <option value={0}>No Timer (Unlimited Time)</option>
                <option value={60}>1 Minute</option>
                <option value={180}>3 Minutes</option>
                <option value={300}>5 Minutes</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-text mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-text mb-2">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="input-field w-full"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red bg-opacity-20 border border-red text-red px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green bg-opacity-20 border border-green text-green px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading || !formData.name}
                className="btn-primary flex-1 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-crust mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Tournament'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="btn-secondary px-6 py-3 text-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Tournament Info */}
        <div className="card mt-8">
          <h3 className="text-lg font-semibold text-text mb-4">Tournament Information</h3>
          <div className="space-y-3 text-subtext0">
            <div className="flex items-start">
              <span className="text-blue mr-2">•</span>
              <span>Students will have {formData.timer_duration === 0 ? 'unlimited time' : `${formData.timer_duration / 60} minute${formData.timer_duration / 60 > 1 ? 's' : ''}`} to complete the typing challenge</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue mr-2">•</span>
              <span>Results are calculated based on Words Per Minute (WPM) and accuracy</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue mr-2">•</span>
              <span>Real-time leaderboard updates as students complete their challenges</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue mr-2">•</span>
              <span>After creating a tournament, you can generate invite codes for students</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue mr-2">•</span>
              <span>Set the tournament status to "Active" when ready for students to participate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTournament; 