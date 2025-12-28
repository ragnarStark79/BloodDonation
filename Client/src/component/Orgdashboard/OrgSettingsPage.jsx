import React, { useState } from 'react';
import { Lock, Save, Trash2, AlertTriangle } from 'lucide-react';
import authApi from '../../api/authApi';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const OrgSettingsPage = () => {
    return (
        <div className="p-6 max-w-3xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <ChangePasswordSection />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 space-y-6">
                <DeleteAccountSection />
            </div>
        </div>
    );
};

const ChangePasswordSection = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error("New passwords do not match");
        }
        if (formData.newPassword.length < 8) {
            return toast.error("Password must be at least 8 characters");
        }

        try {
            setLoading(true);
            await authApi.changePassword(
                formData.currentPassword,
                formData.newPassword,
                formData.confirmPassword
            );
            toast.success("Password changed successfully");
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <Lock size={20} className="text-gray-500" /> Change Password
            </h2>
            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-medium"
                >
                    {loading ? (
                        <>Updating...</>
                    ) : (
                        <>
                            <Save size={18} />
                            Update Password
                        </>
                    )}
                </button>
            </form>
        </section>
    );
};

const DeleteAccountSection = () => {
    const { logout } = useAuth();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete your organization account? This action is irreversible and all your data will be lost.")) {
            return;
        }

        try {
            setDeleting(true);
            await authApi.deleteAccount();
            toast.success("Account deleted successfully");
            logout();
            window.location.href = '/';
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete account");
            setDeleting(false);
        }
    };

    return (
        <section>
            <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2 mb-4">
                <AlertTriangle size={20} /> Danger Zone
            </h2>
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-red-800 mb-1">Delete Account</h3>
                <p className="text-sm text-red-600">
                    Permanently remove your organization account and all associated data. This action cannot be undone.
                </p>
            </div>
            <button
                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition active:bg-red-100 disabled:opacity-50"
                onClick={handleDelete}
                disabled={deleting}
            >
                <Trash2 size={18} />
                {deleting ? 'Deleting...' : 'Delete My Account'}
            </button>
        </section>
    );
}

export default OrgSettingsPage;
