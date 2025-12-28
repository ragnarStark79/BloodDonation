import React from 'react';
import AdminSidebar from './AdminSidebar';
import PendingQueue from './PendingQueue';
import { ShieldCheck } from 'lucide-react';

const VerificationPage = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />

            <main className="flex-1 ml-0 md:ml-20 lg:ml-64 p-6 md:p-8">
                {/* Premium Header Banner */}
                <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-green-600 rounded-2xl shadow-2xl mb-6">
                    <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative p-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm"></div>
                                <div className="relative w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                                    <ShieldCheck className="text-white w-7 h-7" strokeWidth={2.5} />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                                    Request Verification
                                </h2>
                                <p className="text-emerald-100 text-sm mt-1">
                                    Review and approve pending donor and organization registrations
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <PendingQueue />
            </main>
        </div>
    );
};

export default VerificationPage;
