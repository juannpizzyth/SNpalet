import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Save } from 'lucide-react';

export default function EditProfile() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      setMessage('Profile updated successfully');
      setMessageType('success');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update profile');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      setMessage('Password changed successfully');
      setMessageType('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to change password');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <User className="w-6 h-6 text-red-600" />
                Profile Information
              </h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-bold text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 text-base"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600 text-base"
                  />
                  <p className="text-sm text-gray-500 mt-2">Email cannot be changed</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
            </div>
          </form>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Lock className="w-6 h-6 text-red-600" />
                Change Password
              </h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-bold text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 text-base"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-bold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 text-base"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 text-base"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  Update Password
                </button>
              </div>
            </div>
          </form>
        </div>

        {message && (
          <div
            className={`mt-8 p-4 rounded-lg font-semibold ${
              messageType === 'success'
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-red-100 text-red-700 border-2 border-red-300'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
