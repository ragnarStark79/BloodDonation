import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Shield, Lock, Key, Globe, Bell,
    Moon, Sun, Monitor, Clock, MapPin, Filter, CheckCircle,
    Eye, EyeOff, Save, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import authApi from '../../api/authApi';

const AdminProfile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('personal');

    // Basic Info State
    const [basicInfo, setBasicInfo] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // Security State
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false
    });
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    // Preferences State
    const [preferences, setPreferences] = useState({
        theme: 'light',
        language: 'en',
        timezone: 'Asia/Kolkata',
        timeFormat: '24h',
        defaultFilter: '7days',
        notifications: {
            emailPending: true,
            inAppPending: true,
            emailAlerts: true,
            inAppAlerts: true
        }
    });

    // Loading & Saving States
    const [loading, setLoading] = useState({
        basicInfo: false,
        password: false,
        preferences: false
    });

    // Load user data
    useEffect(() => {
        if (user) {
            setBasicInfo({
                name: user.Name || user.name || '',
                email: user.Email || user.email || '',
                phone: user.Phone || user.phone || ''
            });
        }
    }, [user]);

    // Handlers
    const handleBasicInfoUpdate = async () => {
        setLoading({ ...loading, basicInfo: true });
        try {
            // await authApi.updateProfile(basicInfo);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setLoading({ ...loading, basicInfo: false });
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading({ ...loading, password: true });
        try {
            await authApi.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password changed successfully');
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading({ ...loading, password: false });
        }
    };

    const handlePreferencesUpdate = async () => {
        setLoading({ ...loading, preferences: true });
        try {
            toast.success('Preferences updated successfully');
        } catch (error) {
            toast.error('Failed to update preferences');
        } finally {
            setLoading({ ...loading, preferences: false });
        }
    };

    const toggle2FA = async () => {
        try {
            const newStatus = !twoFactorEnabled;
            setTwoFactorEnabled(newStatus);
            toast.success(`2FA ${newStatus ? 'enabled' : 'disabled'} successfully`);
        } catch (error) {
            toast.error('Failed to toggle 2FA');
        }
    };

    const tabs = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'security', label: 'Security', icon: Lock }
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 ml-0 md:ml-20 lg:ml-64 p-6 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header Removed to match Donor Profile style which starts with tabs/title */}

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors relative
                                        ${activeTab === tab.id
                                            ? 'text-red-600'
                                            : 'text-gray-500 hover:text-gray-700'}
                                    `}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600" />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Content Container */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        {activeTab === 'personal' && (
                            <div className="space-y-6">
                                {/* Info Alert */}
                                <div className="border rounded-lg p-4 flex items-start gap-3 bg-blue-50 border-blue-200">
                                    <div className="mt-0.5 text-blue-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium mb-1 text-blue-800">Admin Profile Information</p>
                                        <p className="text-blue-700">You can update your personal details here. Role and Email are managed by the system.</p>
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Full Name" icon={User}>
                                        <input
                                            value={basicInfo.name}
                                            onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white transition-all"
                                            placeholder="Enter your full name"
                                        />
                                    </Field>

                                    <Field label="Email Address" icon={Mail} hint="Read-only">
                                        <input
                                            value={basicInfo.email}
                                            disabled
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                        />
                                    </Field>

                                    <Field label="Phone Number" icon={Phone}>
                                        <input
                                            value={basicInfo.phone}
                                            onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                                            type="tel"
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white transition-all"
                                            placeholder="Enter phone number"
                                        />
                                    </Field>

                                    <Field label="Role" hint="Read-only">
                                        <input
                                            value="ADMIN"
                                            disabled
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed uppercase"
                                        />
                                    </Field>
                                </div>

                                {/* Status Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Verification Status" hint="Read-only">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-2 rounded-lg font-medium text-sm flex-1 text-center bg-green-100 text-green-800 border border-green-200">
                                                VERIFIED
                                            </span>
                                        </div>
                                    </Field>

                                    <Field label="Account Status" hint="Read-only">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-2 rounded-lg font-medium text-sm flex-1 text-center bg-green-100 text-green-800 border border-green-200">
                                                ACTIVE
                                            </span>
                                        </div>
                                    </Field>
                                </div>

                                {/* Save Button Bar */}
                                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-500">
                                        {/* Simplified simplified check */}
                                        <span>Click save to apply changes</span>
                                    </p>
                                    <button
                                        onClick={handleBasicInfoUpdate}
                                        disabled={loading.basicInfo}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${loading.basicInfo
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md active:scale-95'
                                            }`}
                                    >
                                        {loading.basicInfo ? 'Saving...' : (
                                            <>
                                                <Save size={18} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <form onSubmit={handlePasswordChange}>
                                    <div className="grid grid-cols-1 gap-6">
                                        <Field label="Current Password" icon={Lock}>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords.old ? "text" : "password"}
                                                    value={passwordData.oldPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                                    className="w-full p-3 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                                                    placeholder="Enter current password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </Field>

                                        <Field label="New Password" icon={Key}>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords.new ? "text" : "password"}
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    className="w-full p-3 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                                                    placeholder="Enter new password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </Field>

                                        <Field label="Confirm Password" icon={Key}>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords.confirm ? "text" : "password"}
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    className="w-full p-3 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                                                    placeholder="Confirm new password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </Field>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
                                        <button
                                            type="submit"
                                            disabled={loading.password}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${loading.password
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md active:scale-95'
                                                }`}
                                        >
                                            {loading.password ? 'Updating...' : 'Change Password'}
                                        </button>
                                    </div>
                                </form>

                                {/* 2FA Toggle matching styling */}
                                <div className="border-t border-gray-200 pt-6">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                                                <p className="text-xs text-gray-500">Add an extra layer of security</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggle2FA}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFactorEnabled ? 'bg-green-600' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

// Reusable Field Component matching Donor Profile
const Field = ({ label, hint, icon: Icon, children }) => (
    <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            {Icon && <Icon size={16} className="text-gray-400" />}
            {label}
            {hint && <span className="text-xs text-gray-400">({hint})</span>}
        </label>
        {children}
    </div>
);

export default AdminProfile;
