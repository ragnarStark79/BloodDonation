import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OrgSidebar from './OrgSidebar';
import OrgOverview from './OrgOverview';
import InventoryView from './InventoryView';
import RequestsView from './RequestsView';
import IncomingRequestsTab from './IncomingRequestsTab';
import AppointmentsTab from './AppointmentsTab';
import CampsTab from './CampsTab';
import AnalyticsTab from './AnalyticsTab';
import ProfileTab from './ProfileTab';
import OrgSettingsPage from './OrgSettingsPage';
import MyRequestsPage from './MyRequestsPage';
import IncomingRequestsPage from './IncomingRequestsPage';
import DonationPipelineTab from './DonationPipelineTab'; // Hospital pipeline
import BloodBankDonationPipeline from './BloodBankDonationPipeline'; // Blood bank pipeline
import NotificationDropdown from '../DonorDashboard/NotificationDropdown';
import { getOrgTypeLabel } from './orgUtils';
import Footer from '../Footer';

const Org = () => {
    const { user } = useAuth();
    const location = useLocation();
    const isBloodBank = user?.organizationType === 'BANK';

    // Choose the appropriate pipeline component based on organization type
    const DonationPipeline = isBloodBank ? BloodBankDonationPipeline : DonationPipelineTab;

    return (
        <div>
            <div className='bg-black'>
                <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
                    <OrgSidebar />
                    <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-20 lg:ml-64 transition-all duration-300">
                        <main className="p-4 md:p-8 flex-1">
                            {/* Header removed as per user request to avoid duplication with page-specific headers */}

                            <Routes>
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="dashboard" element={<OrgOverview />} />
                                <Route path="inventory" element={<InventoryView />} />
                                <Route path="donations" element={<DonationPipeline />} />
                                <Route path="requests" element={<MyRequestsPage />} />
                                <Route path="incoming" element={<IncomingRequestsPage />} />
                                <Route path="appointments" element={<AppointmentsTab />} />
                                <Route path="camps" element={<CampsTab />} />
                                <Route path="analytics" element={<AnalyticsTab />} />
                                <Route path="profile" element={<ProfileTab />} />
                                <Route path="settings" element={<OrgSettingsPage />} />
                                <Route path="*" element={<Navigate to="/org/dashboard" replace />} />
                            </Routes>
                        </main>
                        {!location.pathname.includes('/profile') && !location.pathname.includes('/settings') && !location.pathname.includes('/donations') && !location.pathname.includes('/appointments') && <Footer role="organization" />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Org;

