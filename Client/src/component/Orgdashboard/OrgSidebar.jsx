import React, { useState } from 'react';
import {
    Home,
    Package,
    FileText,
    Calendar,
    Settings,
    Megaphone,
    BarChart3,
    User,
    LogOut,
    HelpCircle,
    Inbox,
    Menu,
    X,
    Droplet
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { getOrgPermissions } from './orgUtils';

const OrgSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // Get organization type and permissions
    const orgType = user?.organizationType;
    const permissions = getOrgPermissions(orgType);

    const allMenuItems = [
        { icon: Home, label: 'Dashboard', path: '/org/dashboard', visible: true },
        { icon: Package, label: 'Blood Inventory', path: '/org/inventory', visible: permissions.canManageInventory },
        { icon: Droplet, label: 'Donation Pipeline', path: '/org/donations', visible: permissions.canManageDonations },
        { icon: FileText, label: 'My Blood Requests', path: '/org/requests', visible: permissions.canCreateRequests },
        { icon: Inbox, label: 'Incoming Requests', path: '/org/incoming', visible: permissions.canViewIncoming },
        { icon: Calendar, label: 'Appointments', path: '/org/appointments', visible: permissions.canManageAppointments },
        { icon: Megaphone, label: 'Donation Camps', path: '/org/camps', visible: permissions.canCreateCamps },
        { icon: User, label: 'Profile', path: '/org/profile', visible: true },
        { icon: Settings, label: 'Settings', path: '/org/settings', visible: true }
    ];

    // Filter menu items based on visibility
    const menuItems = allMenuItems.filter(item => item.visible);

    const handleNavigation = (path) => {
        navigate(path);
        setIsOpen(false); // Close mobile menu on navigate
    };

    const handleLogout = () => {
        logout();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        toast.success("Logged out successfully");
        window.location.href = '/';
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-gray-700"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 h-full bg-white shadow-xl z-40 transition-transform duration-300 ease-in-out
        w-64 md:w-20 lg:w-64 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-gray-100">
                    <div className="flex items-center gap-2 text-red-600 font-bold text-xl">
                        <Droplet className="fill-current" size={24} />
                        <span className="md:hidden lg:block">LiForce Org</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/org' && location.pathname.startsWith(item.path));

                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavigation(item.path)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative text-left
                  ${isActive
                                        ? 'bg-red-50 text-red-600 border-l-4 border-red-600'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
                            >
                                <Icon size={20} className={isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-600'} />
                                <span className="font-medium md:hidden lg:block">{item.label}</span>

                                {/* Tooltip for tablet view */}
                                <div className="hidden md:block lg:hidden absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                    {item.label}
                                </div>
                            </button>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group relative"
                    >
                        <LogOut size={20} className="text-gray-400 group-hover:text-red-600" />
                        <span className="font-medium md:hidden lg:block">Logout</span>
                        {/* Tooltip for tablet view */}
                        <div className="hidden md:block lg:hidden absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                            Logout
                        </div>
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default OrgSidebar;
