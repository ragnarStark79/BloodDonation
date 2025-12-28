import { useState, useEffect } from "react";
import adminApi from "../../api/adminApi";
import { toast } from "sonner";
import { Search, Filter, Plus, Settings, Trash2 } from "lucide-react";

const UsersTable = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [page, search, roleFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = { page, limit: 10 };
            if (search) params.search = search;
            if (roleFilter !== "ALL") params.role = roleFilter;

            const res = await adminApi.getUsers(params);
            setUsers(res.items || []);
            setTotal(res.total || 0);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUnblock = async (id, currentStatus) => {
        const action = currentStatus === 'BLOCKED' ? 'unblock' : 'block';
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            if (action === 'block') {
                await adminApi.blockUser(id);
            } else {
                await adminApi.unblockUser(id);
            }
            toast.success(`User ${action}ed successfully`);
            fetchUsers();
        } catch (err) {
            console.error(err);
            toast.error(`Failed to ${action} user`);
        }
    };

    const handleDelete = async (id, userName) => {
        if (!window.confirm(`⚠️ Are you sure you want to DELETE user "${userName}"?\n\nThis action CANNOT be undone!`)) return;

        try {
            await adminApi.deleteUser(id);
            toast.success(`User deleted successfully`);
            fetchUsers();
        } catch (err) {
            console.error(err);
            toast.error(`Failed to delete user`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Premium Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl mb-6">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative p-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm"></div>
                            <div className="relative w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                                <Settings className="text-white w-7 h-7" strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                                User Management
                            </h3>
                            <p className="text-purple-100 text-sm mt-1">
                                Manage donors, volunteers and admins • {total} total users
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    User Profile
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Verification
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                                            <p>Loading users...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : users.map((u) => {
                                // Determine avatar gradient based on role
                                const avatarGradient =
                                    u.Role === 'Admin' || u.Role === 'admin' ? 'from-purple-500 to-indigo-600' :
                                        u.Role === 'hospital' || u.Role === 'Hospital' ? 'from-red-500 to-orange-600' :
                                            'from-blue-500 to-cyan-600'; // donor default

                                // Determine role badge color
                                const roleBadgeColor =
                                    u.Role === 'Admin' || u.Role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                        u.Role === 'hospital' || u.Role === 'Hospital' ? 'bg-red-100 text-red-700 border-red-200' :
                                            'bg-blue-100 text-blue-700 border-blue-200';

                                return (
                                    <tr key={u._id} className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200 group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-200`}>
                                                    {u.Name?.split(" ").map(n => n[0]).slice(0, 2).join("") || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">{u.Name}</p>
                                                    <p className="text-xs text-gray-500">{u.Email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${roleBadgeColor}`}>
                                                {u.Role === "Admin" && <Settings className="w-3.5 h-3.5" />}
                                                {u.Role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${u.accountStatus === 'BLOCKED'
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-green-50 text-green-700 border-green-200'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full mr-2 ${u.accountStatus === 'BLOCKED' ? 'bg-red-500' : 'bg-green-500 animate-pulse'
                                                    }`}></span>
                                                {u.accountStatus || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${u.verificationStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                u.verificationStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                {u.verificationStatus || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleBlockUnblock(u._id, u.accountStatus)}
                                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md ${u.accountStatus === 'BLOCKED'
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                                                        : 'bg-gradient-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700'
                                                        }`}
                                                >
                                                    {u.accountStatus === 'BLOCKED' ? 'Unblock' : 'Block'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(u._id, u.Name)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-200 hover:shadow-sm"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-purple-50/30">
                    <span className="text-sm text-gray-600">
                        Showing <span className="font-bold text-indigo-600">{users.length}</span> of{" "}
                        <span className="font-bold text-indigo-600">{total}</span> users
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 text-sm font-semibold border border-indigo-200 rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md disabled:hover:shadow-none"
                        >
                            Previous
                        </button>
                        <div className="flex items-center px-4 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md">
                            Page {page}
                        </div>
                        <button
                            disabled={users.length < 10}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 text-sm font-semibold border border-indigo-200 rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md disabled:hover:shadow-none"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersTable;
