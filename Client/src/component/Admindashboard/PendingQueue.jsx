import { useState, useEffect } from "react";
import adminApi from "../../api/adminApi";
import { toast } from "sonner";
import { Loader2, Check, X, ShieldCheck } from "lucide-react";
import LoadingSkeleton from "../common/LoadingSkeleton";
import ProfileUpdatesTab from "./ProfileUpdatesTab";

const PendingQueue = () => {
    const [activeTab, setActiveTab] = useState('DONOR'); // DONOR, ORGANIZATION, PROFILE_UPDATES
    const [pendingItems, setPendingItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (activeTab === 'PROFILE_UPDATES') return; // ProfileUpdatesTab handles its own fetching
        fetchPending();
    }, [activeTab]);

    const fetchPending = async () => {
        try {
            setLoading(true);
            let res;
            if (activeTab === 'DONOR') {
                res = await adminApi.getDonors({ status: 'PENDING', limit: 10 });
            } else {
                res = await adminApi.getOrgs({ status: 'PENDING', limit: 10 });
            }
            setPendingItems(res.items || []);
        } catch (err) {
            console.error(`Failed to load pending ${activeTab.toLowerCase()}s:`, err);
            toast.error("Failed to load pending items");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setProcessingId(id);
            if (activeTab === 'DONOR') {
                await adminApi.approveDonor(id);
            } else {
                await adminApi.approveOrg(id);
            }
            setPendingItems((prev) => prev.filter((u) => u._id !== id));
            toast.success(`${activeTab === 'DONOR' ? 'Donor' : 'Organization'} approved successfully`);
        } catch (err) {
            console.error('Approval failed:', err);
            toast.error("Failed to approve");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        try {
            setProcessingId(id);
            const reason = prompt("Rejection reason (optional):");
            if (activeTab === 'DONOR') {
                await adminApi.rejectDonor(id, reason || "Not specified");
            } else {
                await adminApi.rejectOrg(id, reason || "Not specified");
            }
            setPendingItems((prev) => prev.filter((u) => u._id !== id));
            toast.success(`${activeTab === 'DONOR' ? 'Donor' : 'Organization'} rejected`);
        } catch (err) {
            console.error('Rejection failed:', err);
            toast.error("Failed to reject");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
            {/* Header with Tabs */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Pending Verifications</h2>
                    <span className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg shadow-md">
                        {pendingItems.length} pending
                    </span>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('DONOR')}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'DONOR'
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Donors
                    </button>
                    <button
                        onClick={() => setActiveTab('ORGANIZATION')}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'ORGANIZATION'
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Organizations
                    </button>
                    <button
                        onClick={() => setActiveTab('PROFILE_UPDATES')}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'PROFILE_UPDATES'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Profile Updates
                    </button>
                </div>
            </div>

            {loading && activeTab !== 'PROFILE_UPDATES' ? (
                <div className="space-y-4">
                    <LoadingSkeleton count={3} height="h-12" />
                </div>
            ) : activeTab === 'PROFILE_UPDATES' ? (
                <ProfileUpdatesTab />
            ) : (
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{activeTab === 'DONOR' ? 'Blood Group' : 'Details'}</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">City</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pendingItems.map((u) => (
                                    <tr key={u._id} className="hover:bg-gradient-to-r hover:from-teal-50/30 hover:to-emerald-50/30 transition-all duration-200 group">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${activeTab === 'DONOR' ? 'from-blue-500 to-cyan-600' : 'from-orange-500 to-red-600'
                                                    } flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all`}>
                                                    {u.Name?.split(" ").map(n => n[0]).slice(0, 2).join("") || "U"}
                                                </div>
                                                <span className="font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">{u.Name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600 text-xs">{u.Email}</td>
                                        <td className="px-4 py-4">
                                            {activeTab === 'DONOR' ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                                    {u.bloodGroup || u.Bloodgroup || 'N/A'}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {u.LicenseNumber ? `Lic: ${u.LicenseNumber}` : 'Org Account'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-gray-700 font-medium">{u.City}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                                    onClick={() => handleApprove(u._id)}
                                                    disabled={processingId === u._id}
                                                >
                                                    {processingId === u._id ? (
                                                        <><Loader2 size={14} className="animate-spin" /> Processing...</>
                                                    ) : (
                                                        <><Check size={14} /> Approve</>
                                                    )}
                                                </button>
                                                <button
                                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                                    onClick={() => handleReject(u._id)}
                                                    disabled={processingId === u._id}
                                                >
                                                    <X size={14} /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {pendingItems.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-16 text-center text-gray-400 text-sm italic" colSpan={5}>
                                            <div className="flex flex-col items-center gap-2">
                                                <ShieldCheck className="w-12 h-12 text-gray-300" />
                                                <p>No pending {activeTab.toLowerCase()} verifications.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingQueue;
