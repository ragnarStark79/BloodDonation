import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar'
import { Bell, Search } from 'lucide-react';
import client from '../../api/client';
import DonorDashboardHome from './DonorDashboardHome';
import ProfilePage from './ProfilePage';
import SettingsPage from './SettingsPage';
import NotificationDropdown from './NotificationDropdown';
import BackendHealthCheck from './BackendHealthCheck';
import NearbyRequests from './NearbyRequests';
import NearbyRequestsPage from './NearbyRequestsPage';
import Appointments from './Appointments';
import HistoryList from './HistoryList';
import CampsPage from './CampsPage';

const Donor = () => {
    const [user, setUser] = useState(null);

    const fetchProfile = async () => {
        try {
            const res = await client.get('/api/donor/profile');
            setUser(res.data);
        } catch (err) {
            console.error("Failed to load profile", err);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        <div>
            <BackendHealthCheck />
            <div className='bg-black'>
                <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
                    <Sidebar />
                    <main className="flex-1 ml-0 md:ml-20 lg:ml-64 p-4 md:p-8 transition-all duration-300">
                        {/* Header */}
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                                <p className="text-gray-500 text-sm">Overview of your donation activities</p>
                            </div>
                            {/*Search bar*/}
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-100 transition-all">
                                    <Search size={18} className="text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="ml-2 outline-none text-sm bg-transparent w-48"
                                    />
                                </div>
                                {/*Notification icon */}
                                <NotificationDropdown />
                                {/*profile*/}
                                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-red-500 to-orange-400 p-0.5 cursor-pointer">
                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Profile" className="w-full h-full" />
                                    </div>
                                </div>
                            </div>
                        </header>

                        <Routes>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<DonorDashboardHome user={user} fetchProfile={fetchProfile} />} />
                            <Route path="nearby-requests" element={<NearbyRequests />} />
                            <Route path="camps" element={<CampsPage />} />
                            <Route path="appointments" element={<Appointments />} />
                            <Route path="history" element={<HistoryList />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="help" element={<div><h1>Help &amp; Support (Coming Soon)</h1></div>} />
                            <Route path="*" element={<Navigate to="/donor/dashboard" replace />} />
                        </Routes>

                    </main>
                </div>

            </div>
        </div>

    )
}

export default Donor
