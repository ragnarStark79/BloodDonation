import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDashboard } from "../../context/DashboardContext";
import {
  Layout,
  Users as UsersIcon,
  Activity,
  Heart,
  Calendar as CalendarIcon,
  Bell,
  Search,
  Plus,
  Settings,
  ChevronRight,
  CheckCircle,
  Menu,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

import { SafePie, SafeLine } from "./SafeChart";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import StockView from "./StockView";
import ReportsView from "./ReportsView";
import BroadcastView from "./BroadcastView";
import AlertsView from "./AlertsView";
import AdminSidebar from "./AdminSidebar";
import PendingQueue from "./PendingQueue";
import UsersTable from "./UsersTable";
import Footer from "../Footer";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
} from "date-fns";

import { toast } from "sonner";
import adminApi from "../../api/adminApi";

/* Admin Dashboard component (single-file full implementation) */
const AdminDashboard = () => {

  let location, navigate;
  try {
    location = useLocation();
    navigate = useNavigate();
  } catch (error) {
    console.error("Router hooks error:", error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Router Error</h2>
          <p className="text-gray-600">
            {error?.message || "Router context not available"}
          </p>
        </div>
      </div>
    );
  }

  // --- Use shared app state from context ---
  let dashboardContext;
  try {
    dashboardContext = useDashboard();
  } catch (error) {
    console.error("DashboardContext error:", error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600">
            {error?.message || "Dashboard context not available"}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Please ensure you're logged in as an admin.
          </p>
        </div>
      </div>
    );
  }

  const {
    stock,
    setStock,
    monthlyDonations,
    setMonthlyDonations,
    donationColumns,
    setDonationColumns,
    users,
    setUsers,
    appointments,
    setAppointments,
    requests,
    setRequests,
    requestColumns,
    setRequestColumns,
    settings,
    setSettings,
    totalUnits,
    fetchDashboardData,
    fetchDonations,
    dataLoading,
  } = dashboardContext;

  // Add fallback fetch on mount to ensure data loads
  useEffect(() => {
    if (!dataLoading && Object.keys(stock || {}).length === 0) {
      fetchDashboardData();
    }
  }, []);



  // Map URL path to page name
  const getPageFromPath = (path) => {
    if (path.includes("/users")) return "Users";
    if (path.includes("/appointments")) return "Appointments";
    if (path.includes("/requests")) return "Requests";
    if (path.includes("/stock")) return "Stock";
    if (path.includes("/reports")) return "Reports";
    if (path.includes("/notifications")) return "Notifications";
    if (path.includes("/alerts")) return "Alerts";
    if (path.includes("/verification")) return "Verification";
    if (path.includes("/settings")) return "Settings";
    return "Dashboard";
  };

  // --- Local UI state ---
  const [activePage, setActivePage] = useState(() =>
    getPageFromPath(location.pathname)
  );
  const [activeSide, setActiveSide] = useState(() =>
    getPageFromPath(location.pathname)
  );

  // Sync activePage with URL changes
  useEffect(() => {
    const page = getPageFromPath(location.pathname);
    setActivePage(page);
    setActiveSide(page);
  }, [location.pathname]);


  // modals & forms
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [showAddDonationModal, setShowAddDonationModal] = useState(false);
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState({
    open: false,
    requestId: null,
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [newAppointment, setNewAppointment] = useState({
    name: "",
    group: Object.keys(stock)[0] || "O+",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "10:00",
    phone: "",
    email: "",
    notes: "",
  });
  const [newRequest, setNewRequest] = useState({
    hospital: "",
    group: Object.keys(stock)[0] || "O+",
    units: 1,
    date: format(new Date(), "yyyy-MM-dd"),
    urgency: "Normal",
    contact: "",
    notes: "",
  });
  const [stockEdit, setStockEdit] = useState({
    group: Object.keys(stock)[0] || "O+",
    change: 0,
    reason: "Donation",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Donor",
    status: "Active",
  });

  const [newDonation, setNewDonation] = useState({
    donorName: "",
    bloodGroup: Object.keys(stock)[0] || "O+",
    phone: "",
    email: "",
    notes: "",
  });

  // Users pagination/search
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 6;

  // Request filters
  const [requestFilter, setRequestFilter] = useState({
    group: "All",
    status: "All",
    urgency: "All",
  });

  // Generate recent activity from existing data
  const recentActivity = useMemo(() => {
    const activities = [];

    // Add recent appointments
    (appointments || []).slice(0, 3).forEach(apt => {
      activities.push({
        _id: `apt-${apt.id}`,
        action: `Appointment scheduled`,
        details: apt.name || 'Donor',
        createdAt: apt.createdAt || new Date()
      });
    });

    // Add recent requests
    (requests || []).slice(0, 2).forEach(req => {
      activities.push({
        _id: `req-${req.id}`,
        action: `Blood request ${req.status?.toLowerCase() || 'received'}`,
        details: req.hospital || 'Hospital',
        createdAt: req.date || new Date()
      });
    });

    // Sort by date and take top 5
    return activities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [appointments, requests]);

  // Derived
  const lowStockTypes = useMemo(
    () =>
      Object.entries(stock)
        .filter(([, v]) => v.units <= settings.threshold)
        .map(([k]) => k),
    [stock, settings.threshold]
  );

  // Get today's donors (donors who donated today)
  const todaysDonors = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Filter appointments from today
    const todaysAppointments = (appointments || []).filter(apt =>
      apt.date === today && apt.status === "Completed"
    );

    // Count donations per donor for today
    const donorMap = new Map();

    todaysAppointments.forEach(apt => {
      const donorName = apt.name || apt.donorId?.Name || apt.donorId?.name || 'Anonymous';
      const count = donorMap.get(donorName) || 0;
      donorMap.set(donorName, count + 1);
    });

    // Convert to array and sort by donation count
    const donorsArray = Array.from(donorMap.entries()).map(([name, count]) => ({
      name,
      donations: count
    }));

    return donorsArray
      .sort((a, b) => b.donations - a.donations)
      .slice(0, 5); // Show top 5 donors from today
  }, [appointments]);

  // Get top donors from users with real donation counts
  const topDonors = useMemo(() => {
    // Filter only donors
    const donors = (users || []).filter(u => u.Role === 'donor' || u.Role === 'DONOR');

    // Count donations per donor
    const donorCounts = donors.map(donor => {
      // Count how many donations this donor has in the pipeline
      let donationCount = 0;

      // Count from donation columns if available
      if (donationColumns) {
        Object.values(donationColumns).forEach(column => {
          if (column.items) {
            column.items.forEach(itemId => {
              // Find the donation and check if it belongs to this donor
              const allDonations = Object.values(donationColumns)
                .flatMap(col => col.items || []);
              // For simplicity, increment count (in real scenario, match donor ID)
              donationCount++;
            });
          }
        });
      }

      // If no pipeline data, use appointment count as proxy
      if (donationCount === 0) {
        donationCount = (appointments || []).filter(a =>
          a.donorId?._id === donor._id || a.donorId === donor._id
        ).length;
      }

      // Fallback to a minimum of 1 if they're in the system
      if (donationCount === 0) donationCount = 1;

      return {
        name: donor.Name || donor.name || 'Anonymous Donor',
        donations: donationCount,
        email: donor.Email || donor.email
      };
    });

    // Sort by donation count and return top 3
    return donorCounts
      .sort((a, b) => b.donations - a.donations)
      .slice(0, 3);
  }, [users, appointments, donationColumns]);

  // Charts config for Recharts
  const COLORS = ["#ef4444", "#dc2626", "#f87171", "#fb7185", "#6366f1", "#818cf8", "#10b981", "#34d399"];

  const pieChartData = useMemo(() => {
    return Object.keys(stock || {}).map((bloodType, index) => ({
      name: bloodType,
      value: (stock || {})[bloodType]?.units || 0,
      color: COLORS[index % COLORS.length]
    }));
  }, [stock]);

  const areaChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month, index) => ({
      month,
      donations: monthlyDonations[index] || 0
    }));
  }, [monthlyDonations]);

  // Drag-and-drop handler for donations
  const onDragEndDonation = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside valid droppable
    if (!destination) return;

    // Dropped in same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceCol = donationColumns[source.droppableId];
    const destCol = donationColumns[destination.droppableId];

    if (!sourceCol || !destCol) {
      console.error("Invalid columns:", { sourceCol, destCol, donationColumns });
      toast.error("Invalid drag operation");
      return;
    }

    if (!sourceCol.items || !destCol.items) {
      console.error("Missing items array:", { sourceCol, destCol });
      toast.error("Invalid column data");
      return;
    }

    // Get the dragged item
    const draggedItem = sourceCol.items[source.index];

    if (!draggedItem) {
      console.error("Dragged item not found at index:", source.index);
      toast.error("Item not found");
      return;
    }

    // Optimistic update - update UI immediately
    const newSourceItems = Array.from(sourceCol.items);
    newSourceItems.splice(source.index, 1);

    const newDestItems = Array.from(destCol.items);
    newDestItems.splice(destination.index, 0, draggedItem);

    const newColumns = {
      ...donationColumns,
      [source.droppableId]: {
        ...sourceCol,
        items: newSourceItems,
      },
      [destination.droppableId]: {
        ...destCol,
        items: newDestItems,
      },
    };

    setDonationColumns(newColumns);

    // Call backend API
    try {
      await adminApi.updateDonationStage(draggableId, destination.droppableId);
      toast.success(`Donation moved to ${destCol.title}`);

      // Refresh data from backend to ensure consistency
      await fetchDonations();
    } catch (error) {
      console.error("Failed to update donation stage:", error);
      toast.error("Failed to move donation. Changes reverted.");

      // Revert optimistic update on error
      setDonationColumns(donationColumns);
    }
  };

  // Handle creating new donation
  const handleAddDonation = async () => {
    const { donorName, bloodGroup, phone, email, notes } = newDonation;

    if (!donorName || !bloodGroup) {
      toast.error("Donor name and blood group are required");
      return;
    }

    try {
      await adminApi.createDonation({
        donorName,
        bloodGroup,
        phone,
        email,
        notes,
      });

      toast.success("Donor registered successfully!");
      setShowAddDonationModal(false);

      // Reset form
      setNewDonation({
        donorName: "",
        bloodGroup: Object.keys(stock)[0] || "O+",
        phone: "",
        email: "",
        notes: "",
      });

      // Refresh donations
      await fetchDonations();
    } catch (error) {
      console.error("Failed to create donation:", error);
      toast.error("Failed to register donor");
    }
  };

  // Calendar helpers
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendar = [];
  let d = startDate;
  while (d <= endDate) {
    calendar.push(d);
    d = addDays(d, 1);
  }

  const appointmentCountsByDay = calendar.reduce((acc, day) => {
    const key = format(day, "yyyy-MM-dd");
    acc[key] = appointments.filter(
      (a) => a.date === key && a.status === "Scheduled"
    ).length;
    return acc;
  }, {});

  // DnD handlers (request pipeline)
  const onDragEndRequest = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const src = requestColumns[source.droppableId];
    const dst = requestColumns[destination.droppableId];
    const srcIds = Array.from(src.items);
    const idx = srcIds.indexOf(draggableId);
    if (idx !== -1) srcIds.splice(idx, 1);
    if (source.droppableId === destination.droppableId) {
      srcIds.splice(destination.index, 0, draggableId);
      setRequestColumns((prev) => ({
        ...prev,
        [src.id]: { ...src, items: srcIds },
      }));
    } else {
      const dstIds = Array.from(dst.items);
      dstIds.splice(destination.index, 0, draggableId);
      setRequestColumns((prev) => ({
        ...prev,
        [src.id]: { ...src, items: srcIds },
        [dst.id]: { ...dst, items: dstIds },
      }));

      // if autoApprove and moved to approved, deduct stock & status update
      if (dst.id === "approved" && settings.autoApprove) {
        const req = requests.find((r) => r.id === draggableId);
        if (req) {
          setStock((prev) => ({
            ...prev,
            [req.group]: {
              ...prev[req.group],
              units: Math.max(0, (prev[req.group].units || 0) - req.units),
            },
          }));
          setRequests((prev) =>
            prev.map((r) =>
              r.id === draggableId ? { ...r, status: "Approved" } : r
            )
          );
        }
      }
    }
  };

  // Approve / reject requests
  const approveRequest = (requestId) => {
    const req = (requests || []).find((r) => r.id === requestId);
    if (!req) return;
    const available = (stock || {})[req.group]?.units || 0;
    if (available < req.units)
      return alert("Insufficient stock to approve this request.");
    setStock((prev) => ({
      ...prev,
      [req.group]: {
        ...prev[req.group],
        units: Math.max(0, prev[req.group].units - req.units),
      },
    }));
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "Approved" } : r))
    );
    setRequestColumns((prev) => {
      const newPrev = { ...prev };
      Object.keys(newPrev).forEach((k) => {
        newPrev[k].items = newPrev[k].items.filter((x) => x !== requestId);
      });
      newPrev.approved.items = [requestId, ...newPrev.approved.items];
      return newPrev;
    });
  };

  const openReject = (requestId) =>
    setShowRejectModal({ open: true, requestId });

  const handleReject = () => {
    const id = showRejectModal.requestId;
    if (!id) return setShowRejectModal({ open: false, requestId: null });
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
            ...r,
            status: "Rejected",
            notes: (r.notes || "") + "\nRejected: " + rejectReason,
          }
          : r
      )
    );
    setRequestColumns((prev) => {
      const newPrev = { ...prev };
      Object.keys(newPrev).forEach((k) => {
        newPrev[k].items = newPrev[k].items.filter((x) => x !== id);
      });
      return newPrev;
    });
    setRejectReason("");
    setShowRejectModal({ open: false, requestId: null });
  };

  // Create request
  const createRequest = () => {
    if (!newRequest.hospital) return alert("Enter hospital name");
    const id = `r-${Date.now()}`;
    const obj = { id, ...newRequest, status: "Pending" };
    setRequests((prev) => [obj, ...prev]);
    setRequestColumns((prev) => ({
      ...prev,
      pending: { ...prev.pending, items: [id, ...prev.pending.items] },
    }));
    setShowAddRequestModal(false);
    setNewRequest({
      hospital: "",
      group: Object.keys(stock || {})[0] || "O+",
      units: 1,
      date: format(new Date(), "yyyy-MM-dd"),
      urgency: "Normal",
      contact: "",
      notes: "",
    });
  };

  // Stock edit
  const submitStockChange = async () => {
    const { group, change, reason } = stockEdit;
    if (!group) return;
    try {
      await client.put("/api/admin/stock", {
        group,
        change: Number(change),
        reason,
      });
      toast.success("Stock updated successfully");
      setShowAddStockModal(false);
      setStockEdit({
        group: Object.keys(stock || {})[0] || "O+",
        change: 0,
        reason: "Donation",
      });
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to update stock:", err);
      toast.error("Failed to update stock");
    }
  };

  // Appointments
  const createAppointment = async () => {
    if (!newAppointment.name) {
      toast.error("Enter donor name");
      return;
    }
    try {
      await client.post("/api/admin/appointments", {
        name: newAppointment.name,
        group: newAppointment.group,
        date: newAppointment.date,
        time: newAppointment.time,
        phone: newAppointment.phone,
        email: newAppointment.email,
        notes: newAppointment.notes,
      });
      toast.success("Appointment created successfully");
      setShowAddAppointmentModal(false);
      setNewAppointment({
        name: "",
        group: Object.keys(stock || {})[0] || "O+",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "10:00",
        phone: "",
        email: "",
        notes: "",
      });
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to create appointment:", err);
      toast.error("Failed to create appointment");
    }
  };

  const cancelAppointment = (id) =>
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Cancelled" } : a))
    );

  // Users
  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return alert("Enter name & email");
    const id = (users || []).length
      ? Math.max(...(users || []).map((u) => u.id)) + 1
      : 1;
    setUsers((prev) => [
      {
        id,
        ...newUser,
        avatar: newUser.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join(""),
      },
      ...prev,
    ]);
    setShowAddUserModal(false);
    setNewUser({ name: "", email: "", role: "Donor", status: "Active" });
  };

  // Users pagination
  const filteredUsers = (users || []).filter((u) =>
    (u.name + u.email + u.role).toLowerCase().includes(userSearch.toLowerCase())
  );
  const totalUserPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / usersPerPage)
  );
  const visibleUsers = filteredUsers.slice(
    (userPage - 1) * usersPerPage,
    userPage * usersPerPage
  );

  // Sidebar items
  const sidebarItems = [
    { label: "Dashboard", icon: Layout },
    { label: "Users", icon: UsersIcon },
    { label: "Appointments", icon: CalendarIcon },
    { label: "Requests", icon: Activity },
    { label: "Stock", icon: Heart },
    { label: "Reports", icon: Activity },
    { label: "Notifications", icon: Bell },
    { label: "Alerts", icon: AlertTriangle },
    { label: "Settings", icon: Settings },
  ];




  // Ensure we have default values to prevent null errors
  const safeStock = stock || {};
  const safeUsers = users || [];
  const safeAppointments = appointments || [];
  const safeRequests = requests || [];

  // Show loading state (moved to bottom to strictly follow Rules of Hooks)
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Dashboard...</h2>
          <p className="text-gray-500 text-sm mt-2">Fetching latest data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-20 lg:ml-64 transition-all duration-300">
        <main className="p-6 md:p-8 flex-1">
          {/* Premium Header Banner - Hidden on Users and Stock pages */}
          {activePage !== "Users" && activePage !== "Stock" && (
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 rounded-2xl shadow-2xl mb-6">
              <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500/20 rounded-2xl blur-sm"></div>
                      <div className="relative w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Layout className="text-white w-7 h-7" strokeWidth={2.5} />
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-1">
                        {activePage}
                      </h2>
                      <p className="text-slate-400 text-sm">
                        Welcome back — manage donors, stock, requests and settings from here.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Quick Stats */}
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                      <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-slate-300">System Online</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {/* Admin Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg cursor-pointer hover:shadow-red-500/25 hover:shadow-xl transition-all">
                      AD
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="animate-fade-in">
            {/* Dashboard */}
            {activePage === "Dashboard" && (
              <>
                {/* Stats */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="rounded-2xl p-6 shadow-sm bg-white border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
                    <div className="relative flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Heart className="text-blue-600" size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          Total Units
                        </p>
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-3xl font-bold text-gray-900">
                            {totalUnits}
                          </h3>
                          <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md">
                            {Object.keys(stock || {}).length} groups
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Today: {monthlyDonations[new Date().getMonth()] || 0} donations
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-6 shadow-sm bg-white border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
                    <div className="relative flex items-center gap-4">
                      <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Activity className="text-orange-600" size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          Active Requests
                        </p>
                        <h3 className="text-3xl font-bold text-gray-900">
                          {(requests || []).filter(
                            (r) =>
                              r.status === "Pending" ||
                              r.status === "Verified" ||
                              r.status === "Approved"
                          ).length > 0
                            ? (requests || []).filter(
                              (r) =>
                                r.status === "Pending" ||
                                r.status === "Verified" ||
                                r.status === "Approved"
                            ).length
                            : "—"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Urgent:{" "}
                          {(requests || []).filter(
                            (r) => r.urgency === "Critical" || r.urgency === "High"
                          ).length > 0
                            ? (requests || []).filter(
                              (r) =>
                                r.urgency === "Critical" || r.urgency === "High"
                            ).length
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-6 shadow-sm bg-white border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
                    <div className="relative flex items-center gap-4">
                      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CalendarIcon className="text-green-600" size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          Appointments Today
                        </p>
                        <h3 className="text-3xl font-bold text-gray-900">
                          {(appointments || []).filter(
                            (a) =>
                              a.date === format(new Date(), "yyyy-MM-dd") &&
                              a.status === "Scheduled"
                          ).length > 0
                            ? (appointments || []).filter(
                              (a) =>
                                a.date === format(new Date(), "yyyy-MM-dd") &&
                                a.status === "Scheduled"
                            ).length
                            : "—"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Scheduled this month:{" "}
                          {(appointments || []).length > 0
                            ? (appointments || []).length
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-6 shadow-sm bg-white border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
                    <div className="relative flex items-center gap-4">
                      <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="text-red-600" size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          Low Stock Alerts
                        </p>
                        <h3 className="text-3xl font-bold text-gray-900">
                          {lowStockTypes.length > 0 ? lowStockTypes.length : "—"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Threshold: {settings.threshold} units
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Charts */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 col-span-2 h-80">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800">
                        Monthly Donations
                      </h3>
                      <div className="text-xs text-gray-500">Trend per month</div>
                    </div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={areaChartData}>
                          <defs>
                            <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="donations"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorDonations)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-80">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800">
                        Blood Type Availability
                      </h3>
                      <div className="text-xs text-gray-500">Units by group</div>
                    </div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Legend
                            verticalAlign="middle"
                            align="right"
                            layout="vertical"
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      <strong>Low stock:</strong>{" "}
                      {lowStockTypes.length ? lowStockTypes.join(", ") : "—"}
                    </div>
                  </div>
                </section>

                {/* Summary */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-400" /> Recent
                      Activity
                    </h4>
                    <ul className="space-y-3 text-sm text-gray-600">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <li key={activity._id || index} className="flex flex-col gap-1 pb-3 border-b border-gray-100 last:border-0">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-800">{activity.action}</span>
                              <span className="text-xs text-gray-400">
                                {activity.createdAt ? new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                              </span>
                            </div>
                            {activity.details && (
                              <span className="text-xs text-gray-500">{activity.details}</span>
                            )}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-400 italic">No recent activity</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-gray-400" /> Today's Donors
                    </h4>
                    {todaysDonors.length > 0 ? (
                      <ol className="space-y-3">
                        {todaysDonors.map((d, index) => (
                          <li
                            key={`donor-${index}`}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">{d.name}</p>
                              <p className="text-xs text-gray-400">
                                Donations today: {d.donations}
                              </p>
                            </div>
                            <div className="text-sm font-bold text-gray-800">
                              {d.donations}
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-gray-400 italic text-sm">No donations today yet</p>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-400" /> Alerts
                    </h4>
                    <div className="space-y-3">
                      {/* Low Stock Alerts */}
                      {lowStockTypes.length > 0 && lowStockTypes.map((t) => (
                        <div
                          key={`low-${t}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
                        >
                          <div>
                            <p className="font-medium text-sm">{t} low stock</p>
                            <p className="text-xs text-gray-500">
                              Urgent restock needed
                            </p>
                          </div>
                          <div className="text-sm font-bold text-red-700">
                            {stock[t]?.units || 0} U
                          </div>
                        </div>
                      ))}

                      {/* Show message if no alerts */}
                      {lowStockTypes.length === 0 && (
                        <div className="text-sm text-gray-400 italic text-center py-3">
                          All blood groups are well stocked
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Users page - DISABLED: Using UsersTable component instead */}
            {false && activePage === "Users" && (
              <>
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        User Management
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Manage donors, volunteers and admins.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="relative">
                        <input
                          value={userSearch}
                          onChange={(e) => {
                            setUserSearch(e.target.value);
                            setUserPage(1);
                          }}
                          placeholder="Search users..."
                          className="px-4 py-2 border rounded-lg outline-none text-sm w-64"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                      </div>
                      <button
                        onClick={() => setShowAddUserModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                      >
                        <Plus className="w-4 h-4" /> Add User
                      </button>
                    </div>
                  </div>
                </section>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
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
                            Last Active
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {visibleUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-gray-50/80 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm">
                                  {user.avatar}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-gray-900">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1.5">
                                {user.role === "Admin" ? (
                                  <Settings className="w-3.5 h-3.5 text-indigo-500" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                )}
                                {user.role}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${user.status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : user.status === "Offline"
                                    ? "bg-gray-100 text-gray-600"
                                    : "bg-orange-100 text-orange-600"
                                  } bg-opacity-50 border-opacity-20`}
                              >
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">
                              {user.lastActive}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Settings className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/30">
                    <span className="text-sm text-gray-500">
                      Showing{" "}
                      <span className="font-bold text-gray-900">
                        {(userPage - 1) * usersPerPage + 1}
                      </span>{" "}
                      -{" "}
                      <span className="font-bold text-gray-900">
                        {Math.min(userPage * usersPerPage, filteredUsers.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold text-gray-900">
                        {filteredUsers.length}
                      </span>{" "}
                      users
                    </span>

                    <div className="flex gap-2">
                      <button
                        disabled={userPage === 1}
                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-600 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        disabled={userPage === totalUserPages}
                        onClick={() =>
                          setUserPage((p) => Math.min(totalUserPages, p + 1))
                        }
                        className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-600 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Appointments */}
            {activePage === "Appointments" && (
              <>
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Appointment Scheduling
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage donor appointments and time slots.
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <button
                      onClick={() => setShowAddAppointmentModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg"
                    >
                      <Plus className="w-4 h-4" /> Add Appointment
                    </button>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold">Appointments</h4>
                      <div className="text-xs text-gray-500">
                        Total: {appointments.length}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                              Donor
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                              Group
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                              Time
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(appointments || []).map((a) => (
                            <tr
                              key={a.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                    {a.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .slice(0, 2)
                                      .join("")}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {a.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {a.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">{a.group}</td>
                              <td className="px-4 py-3 text-sm">{a.date}</td>
                              <td className="px-4 py-3 text-sm">{a.time}</td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === "Scheduled"
                                    ? "bg-blue-50 text-blue-700"
                                    : a.status === "Completed"
                                      ? "bg-green-50 text-green-700"
                                      : "bg-red-50 text-red-700"
                                    }`}
                                >
                                  {a.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      /* edit stub */
                                    }}
                                    className="p-2 rounded-lg hover:bg-gray-50 text-gray-500"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => cancelAppointment(a.id)}
                                    className="p-2 rounded-lg hover:bg-gray-50 text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold mb-3">Calendar</h4>
                    <div className="grid grid-cols-7 gap-1 text-xs text-center">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (d) => (
                          <div key={d} className="py-1 text-gray-500">
                            {d}
                          </div>
                        )
                      )}
                      {calendar.map((day) => {
                        const key = format(day, "yyyy-MM-dd");
                        const count = appointmentCountsByDay[key] || 0;
                        const inMonth = isSameMonth(day, today);
                        return (
                          <div
                            key={key}
                            className={`p-2 rounded ${isSameDay(day, new Date()) ? "bg-red-50" : ""
                              }`}
                          >
                            <div
                              className={`${inMonth ? "text-gray-700" : "text-gray-300"
                                } text-xs`}
                            >
                              {format(day, "d")}
                            </div>
                            {count > 0 && (
                              <div className="mt-1 text-[10px] font-semibold text-white bg-red-600 rounded-full w-6 h-6 mx-auto flex items-center justify-center">
                                {count}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Requests */}
            {activePage === "Requests" && (
              <>
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Blood Requests
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage hospital and external requests.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <select
                      value={requestFilter.group}
                      onChange={(e) =>
                        setRequestFilter((s) => ({ ...s, group: e.target.value }))
                      }
                      className="px-3 py-2 border rounded-lg"
                    >
                      <option>All</option>
                      {Object.keys(stock).map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                    <select
                      value={requestFilter.status}
                      onChange={(e) =>
                        setRequestFilter((s) => ({
                          ...s,
                          status: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border rounded-lg"
                    >
                      <option>All</option>
                      <option>Pending</option>
                      <option>Approved</option>
                      <option>Rejected</option>
                      <option>Fulfilled</option>
                    </select>
                    <button
                      onClick={() => setShowAddRequestModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                    >
                      <Plus className="w-4 h-4" /> New Request
                    </button>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                              Request
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                              Group
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                              Units
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                              Urgency
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {requests
                            .filter(
                              (r) =>
                                (requestFilter.group === "All"
                                  ? true
                                  : r.group === requestFilter.group) &&
                                (requestFilter.status === "All"
                                  ? true
                                  : r.status === requestFilter.status)
                            )
                            .map((r) => (
                              <tr
                                key={r.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium">{r.hospital}</p>
                                    <p className="text-xs text-gray-400">
                                      {r.contact}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm">{r.group}</td>
                                <td className="px-4 py-3 text-sm">{r.units}</td>
                                <td className="px-4 py-3 text-sm">{r.urgency}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${r.status === "Pending"
                                      ? "bg-yellow-50 text-yellow-700"
                                      : r.status === "Approved"
                                        ? "bg-green-50 text-green-700"
                                        : "bg-red-50 text-red-700"
                                      }`}
                                  >
                                    {r.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => approveRequest(r.id)}
                                      className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => openReject(r.id)}
                                      className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-sm"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold mb-4">Request Pipeline</h4>
                    <div className="space-y-3">
                      <DragDropContext onDragEnd={onDragEndRequest}>
                        {Object.values(requestColumns).map((col) => (
                          <Droppable key={col.id} droppableId={col.id}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="mb-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-sm">
                                    {col.title}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {col.items.length}
                                  </span>
                                </div>
                                <div className="p-2 bg-gray-50 rounded space-y-2 min-h-[80px]">
                                  {col.items.map((rid, idx) => {
                                    const r = (requests || []).find(
                                      (x) => x.id === rid
                                    );
                                    if (!r) return null;
                                    return (
                                      <Draggable
                                        key={rid}
                                        draggableId={rid}
                                        index={idx}
                                      >
                                        {(pr) => (
                                          <div
                                            ref={pr.innerRef}
                                            {...pr.draggableProps}
                                            {...pr.dragHandleProps}
                                            className="bg-white rounded p-2 shadow-sm flex items-center justify-between"
                                          >
                                            <div>
                                              <p className="text-sm font-medium">
                                                {r.hospital}
                                              </p>
                                              <p className="text-xs text-gray-400">
                                                {r.group} • {r.units} U
                                              </p>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {r.urgency}
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {provided.placeholder}
                                </div>
                              </div>
                            )}
                          </Droppable>
                        ))}
                      </DragDropContext>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Stock */}
            {activePage === "Stock" && <StockView />}

            {/* Reports */}
            {activePage === "Reports" && <ReportsView />}

            {/* Notifications */}
            {activePage === "Notifications" && <BroadcastView />}

            {/* Alerts */}
            {activePage === "Alerts" && <AlertsView />}

            {/* Users */}
            {activePage === "Users" && <UsersTable />}

            {/* Settings */}
            {activePage === "Settings" && (
              <>
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-6">
                  <h3 className="text-lg font-bold text-gray-800">Settings</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Profile, system preferences and user roles.
                  </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold mb-3">Profile</h4>
                    <label className="text-xs text-gray-500">Name</label>
                    <input
                      className="w-full mb-3 px-3 py-2 border rounded-lg"
                      value={settings.profile.name}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          profile: { ...s.profile, name: e.target.value },
                        }))
                      }
                    />
                    <label className="text-xs text-gray-500">Email</label>
                    <input
                      className="w-full mb-3 px-3 py-2 border rounded-lg"
                      value={settings.profile.email}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          profile: { ...s.profile, email: e.target.value },
                        }))
                      }
                    />
                    <button
                      onClick={() => alert("Profile saved (frontend only)")}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                    >
                      Save Profile
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold mb-3">System</h4>
                    <label className="text-xs text-gray-500">
                      Low stock threshold (units)
                    </label>
                    <input
                      type="number"
                      value={settings.threshold}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          threshold: Number(e.target.value),
                        }))
                      }
                      className="w-full mb-3 px-3 py-2 border rounded-lg"
                    />
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium">
                          Low stock notifications
                        </p>
                        <p className="text-xs text-gray-400">
                          Send alerts when stock goes below threshold
                        </p>
                      </div>
                      <label className="inline-flex relative items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.lowStock}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              notifications: {
                                ...s.notifications,
                                lowStock: e.target.checked,
                              },
                            }))
                          }
                          className="sr-only"
                        />
                        <div
                          className={`w-10 h-5 rounded-full transition ${settings.notifications.lowStock
                            ? "bg-green-500"
                            : "bg-gray-300"
                            }`}
                        ></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Auto-approve requests
                        </p>
                        <p className="text-xs text-gray-400">
                          Automatically approve requests when stock is sufficient
                        </p>
                      </div>
                      <label className="inline-flex relative items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoApprove}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              autoApprove: e.target.checked,
                            }))
                          }
                          className="sr-only"
                        />
                        <div
                          className={`w-10 h-5 rounded-full transition ${settings.autoApprove ? "bg-green-500" : "bg-gray-300"
                            }`}
                        ></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold mb-3">Roles & Permissions</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Quick manage user roles
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Add Admin</p>
                          <p className="text-xs text-gray-400">
                            Create a new admin user
                          </p>
                        </div>
                        <button className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">
                          Add
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Manage Roles</p>
                          <p className="text-xs text-gray-400">
                            Assign permissions to users
                          </p>
                        </div>
                        <button className="px-3 py-1 rounded bg-indigo-50 text-indigo-600 text-sm">
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        {/* ---------- MODALS ---------- */}

        {/* Add Appointment */}
        {showAddAppointmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Add Appointment</h3>
              <label className="text-xs text-gray-500">Donor Name</label>
              <input
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={newAppointment.name}
                onChange={(e) =>
                  setNewAppointment((s) => ({ ...s, name: e.target.value }))
                }
              />
              <label className="text-xs text-gray-500">Blood Group</label>
              <select
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={newAppointment.group}
                onChange={(e) =>
                  setNewAppointment((s) => ({ ...s, group: e.target.value }))
                }
              >
                {Object.keys(stock).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <label className="text-xs text-gray-500">Date</label>
              <input
                type="date"
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={newAppointment.date}
                onChange={(e) =>
                  setNewAppointment((s) => ({ ...s, date: e.target.value }))
                }
              />
              <label className="text-xs text-gray-500">Time</label>
              <input
                type="time"
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={newAppointment.time}
                onChange={(e) =>
                  setNewAppointment((s) => ({ ...s, time: e.target.value }))
                }
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg border"
                  onClick={() => setShowAddAppointmentModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-red-600 text-white"
                  onClick={createAppointment}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Request */}
        {showAddRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Create Request</h3>
              <label className="text-xs text-gray-500">
                Hospital / Requester
              </label>
              <input
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={newRequest.hospital}
                onChange={(e) =>
                  setNewRequest((s) => ({ ...s, hospital: e.target.value }))
                }
              />
              <label className="text-xs text-gray-500">Blood Group</label>
              <select
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={newRequest.group}
                onChange={(e) =>
                  setNewRequest((s) => ({ ...s, group: e.target.value }))
                }
              >
                {Object.keys(stock).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <label className="text-xs text-gray-500">Units Needed</label>
              <input
                type="number"
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={newRequest.units}
                onChange={(e) =>
                  setNewRequest((s) => ({ ...s, units: Number(e.target.value) }))
                }
              />
              <label className="text-xs text-gray-500">Urgency</label>
              <select
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={newRequest.urgency}
                onChange={(e) =>
                  setNewRequest((s) => ({ ...s, urgency: e.target.value }))
                }
              >
                <option>Normal</option>
                <option>High</option>
                <option>Critical</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg border"
                  onClick={() => setShowAddRequestModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
                  onClick={createRequest}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stock Edit */}
        {showAddStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Adjust Stock</h3>
              <label className="text-xs text-gray-500">Group</label>
              <select
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={stockEdit.group}
                onChange={(e) =>
                  setStockEdit((s) => ({ ...s, group: e.target.value }))
                }
              >
                {Object.keys(stock).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <label className="text-xs text-gray-500">
                Change (positive = add, negative = remove)
              </label>
              <input
                type="number"
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={stockEdit.change}
                onChange={(e) =>
                  setStockEdit((s) => ({ ...s, change: Number(e.target.value) }))
                }
              />
              <label className="text-xs text-gray-500">Reason</label>
              <select
                className="w-full mb-4 px-3 py-2 border rounded-lg"
                value={stockEdit.reason}
                onChange={(e) =>
                  setStockEdit((s) => ({ ...s, reason: e.target.value }))
                }
              >
                <option>Donation</option>
                <option>Hospital Request</option>
                <option>Expiry</option>
                <option>Testing</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg border"
                  onClick={() => setShowAddStockModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
                  onClick={submitStockChange}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Request */}
        {showRejectModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Reject Request</h3>
              <label className="text-xs text-gray-500">Reason</label>
              <textarea
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg border"
                  onClick={() =>
                    setShowRejectModal({ open: false, requestId: null })
                  }
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-red-600 text-white"
                  onClick={handleReject}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add User */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold mb-4">Add User</h3>
              <label className="text-xs text-gray-500">Name</label>
              <input
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, name: e.target.value }))
                }
              />
              <label className="text-xs text-gray-500">Email</label>
              <input
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, email: e.target.value }))
                }
              />
              <label className="text-xs text-gray-500">Role</label>
              <select
                className="w-full mb-3 px-3 py-2 border rounded-lg"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, role: e.target.value }))
                }
              >
                <option>Donor</option>
                <option>Volunteer</option>
                <option>Admin</option>
              </select>
              <label className="text-xs text-gray-500">Status</label>
              <select
                className="w-full mb-4 px-3 py-2 border rounded-lg"
                value={newUser.status}
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, status: e.target.value }))
                }
              >
                <option>Active</option>
                <option>Offline</option>
                <option>Pending</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg border"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
                  onClick={handleAddUser}
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Donation Modal */}
        {showAddDonationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Register New Donor</h3>
                <p className="text-sm text-gray-500 mt-1">Add a new donor to the donation pipeline</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name *</label>
                  <input
                    type="text"
                    value={newDonation.donorName}
                    onChange={(e) => setNewDonation({ ...newDonation, donorName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group *</label>
                  <select
                    value={newDonation.bloodGroup}
                    onChange={(e) => setNewDonation({ ...newDonation, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 outline-none"
                  >
                    {Object.keys(stock).map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newDonation.phone}
                    onChange={(e) => setNewDonation({ ...newDonation, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 outline-none"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newDonation.email}
                    onChange={(e) => setNewDonation({ ...newDonation, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newDonation.notes}
                    onChange={(e) => setNewDonation({ ...newDonation, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 outline-none"
                    rows="3"
                    placeholder="First time donor, no medical history..."
                  />
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddDonationModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDonation}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                >
                  Register Donor
                </button>
              </div>
            </div>
          </div>
        )}
        <Footer role="admin" />
      </div>
    </div>
  );
};

export default AdminDashboard;