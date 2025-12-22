import { createContext, useContext, useState, useEffect, useMemo } from "react";
import client from "../api/client";
import adminApi from "../api/adminApi";
import orgApi from "../api/orgApi";
import { useAuth } from "./AuthContext";

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  // Get authentication state
  const { user, loading: authLoading } = useAuth();

  // Add loading state for dashboard data
  const [dataLoading, setDataLoading] = useState(true);

  // Ensure children is valid
  if (!children) {
    console.error("DashboardProvider: No children provided");
    return null;
  }
  // Stock: { "O+": { units: 150, reserved: 10 }, "A+": { units: 120, reserved: 5 }, ... }
  // Initialize as empty - will be populated by API
  const [stock, setStock] = useState({});

  // Monthly donations: array of 12 values (Jan-Dec)
  // Initialize as zeros - will be populated by API
  const [monthlyDonations, setMonthlyDonations] = useState([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  // Donation pipeline columns (Kanban)
  // Initialize as empty - will be populated by API
  const [donationColumns, setDonationColumns] = useState({
    "new-donors": {
      id: "new-donors",
      title: "NEW DONORS",
      color: "from-red-50 to-red-100/50",
      items: [],
    },
    screening: {
      id: "screening",
      title: "SCREENING",
      color: "from-blue-50 to-blue-100/50",
      items: [],
    },
    "in-progress": {
      id: "in-progress",
      title: "DONATION IN PROGRESS",
      color: "from-yellow-50 to-yellow-100/50",
      items: [],
    },
    completed: {
      id: "completed",
      title: "COMPLETED DONATIONS",
      color: "from-green-50 to-green-100/50",
      items: [],
    },
    "ready-storage": {
      id: "ready-storage",
      title: "READY FOR STORAGE",
      color: "from-slate-50 to-slate-100/50",
      items: [],
    },
  });

  // Users - Initialize as empty
  const [users, setUsers] = useState([]);

  // Appointments - Initialize as empty
  const [appointments, setAppointments] = useState([]);

  // Requests - Initialize as empty
  const [requests, setRequests] = useState([]);

  // Request pipeline columns
  const [requestColumns, setRequestColumns] = useState({
    pending: { id: "pending", title: "Pending", items: [] },
    verified: { id: "verified", title: "Verified", items: [] },
    approved: { id: "approved", title: "Approved", items: [] },
    rejected: { id: "rejected", title: "Rejected", items: [] },
  });

  // Settings
  const [settings, setSettings] = useState({
    threshold: 20,
    autoApprove: false,
    notifications: { lowStock: true },
    profile: { name: "Admin", email: "admin@liforce.com" },
  });

  // Computed: total units
  const totalUnits = useMemo(() => {
    return Object.values(stock).reduce((sum, s) => sum + (s.units || 0), 0);
  }, [stock]);

  const fetchDashboardData = async () => {
    try {
      // Check user role to determine which API to use
      // Normalize role to ensure consistent check (handles 'admin', 'Admin', 'ADMIN')
      const rawRole = user?.Role || user?.role || "";
      const userRole = rawRole.toString().toUpperCase();
      const isAdmin = userRole === 'ADMIN';

      console.log(`📊 [DashboardContext] Fetching data for role: ${userRole}`);

      // Only fetch admin-specific data if user is an admin
      if (isAdmin) {
        // Fetch stock data
        try {
          const stockData = await adminApi.getStock();
          if (stockData && Object.keys(stockData).length > 0) {
            setStock(stockData);
          }
        } catch (err) {
          console.error("Failed to fetch stock:", err);
        }

        // Fetch monthly donations
        try {
          const donationsData = await adminApi.getMonthlyDonations();
          if (Array.isArray(donationsData)) {
            setMonthlyDonations(donationsData);
          }
        } catch (err) {
          console.error("Failed to fetch monthly donations:", err);
        }

        // Fetch donation pipeline
        try {
          const pipelineData = await adminApi.getDonationPipeline();
          if (pipelineData && pipelineData["new-donors"]) {
            setDonationColumns(pipelineData);
          }
        } catch (err) {
          console.error("Failed to fetch donation pipeline:", err);
        }

        // Fetch users
        try {
          const usersData = await adminApi.getUsers({ limit: 100 });
          if (usersData?.items) {
            setUsers(
              usersData.items.map((u) => ({
                id: u._id,
                name: u.Name || u.name,
                email: u.Email || u.email,
                role: u.Role || u.role,
                status:
                  u.accountStatus === "ACTIVE"
                    ? "Active"
                    : u.accountStatus || "Offline",
                avatar: (u.Name || u.name || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join(""),
                lastActive: "Recently",
              }))
            );
          }
        } catch (err) {
          console.error("Failed to fetch users:", err);
        }

        // Fetch appointments
        try {
          const appointmentsData = await adminApi.getAppointments();
          if (Array.isArray(appointmentsData)) {
            setAppointments(
              appointmentsData.map((a) => ({
                id: a._id,
                name: a.donorName || "Unknown",
                group: a.bloodGroup || "O+",
                date: a.dateTime
                  ? new Date(a.dateTime).toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0],
                time: a.dateTime
                  ? new Date(a.dateTime).toTimeString().slice(0, 5)
                  : "10:00",
                email: a.donorEmail || "",
                phone: a.phone || "",
                status:
                  a.status === "UPCOMING" ? "Scheduled" : a.status || "Scheduled",
                notes: a.notes || "",
              }))
            );
          }
        } catch (err) {
          console.error("Failed to fetch appointments:", err);
        }

        // Fetch requests
        try {
          const requestsData = await adminApi.getRequests();
          if (Array.isArray(requestsData)) {
            setRequests(
              requestsData.map((r) => ({
                id: r._id,
                hospital: r.hospitalName || r.createdByName || "Unknown",
                group: r.bloodGroup,
                units: r.units,
                date: r.createdAt
                  ? new Date(r.createdAt).toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0],
                urgency: r.urgency || "Normal",
                contact: r.contact || "",
                status:
                  r.status === "OPEN"
                    ? "Pending"
                    : r.status === "FULFILLED"
                      ? "Approved"
                      : r.status || "Pending",
                notes: r.notes || "",
              }))
            );
          }
        } catch (err) {
          console.error("Failed to fetch requests:", err);
        }

        // Mark data as loaded
        setDataLoading(false);
      } else {
        console.log("ℹ️ [DashboardContext] Skipping admin API calls for non-admin user");
        setDataLoading(false);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setDataLoading(false);
    }
  };

  // Fetch donations from backend
  const fetchDonations = async () => {
    try {
      // Check user role
      const rawRole = user?.Role || user?.role || "";
      const userRole = rawRole.toString().toUpperCase();
      const isAdmin = userRole === 'ADMIN';

      if (isAdmin) {
        const data = await adminApi.getDonations();
        setDonationColumns(data);
        console.log("✅ [DashboardContext] Donations fetched successfully");
      } else {
        console.log("ℹ️ [DashboardContext] Skipping admin donations fetch for non-admin user");
      }
    } catch (err) {
      console.error("Failed to fetch donations:", err);
    }
  };


  // Fetch data reactively when user authentication state changes
  useEffect(() => {
    // Wait for auth to finish loading first
    if (authLoading) {
      console.log('⏳ [DashboardContext] Waiting for auth to load...');
      return;
    }

    // Check if user is authenticated (has token and user object)
    const token = localStorage.getItem('accessToken');

    if (user && token) {
      console.log('📊 [DashboardContext] User authenticated, fetching dashboard data');
      fetchDashboardData();
      fetchDonations(); // Fetch donations from backend

      // Auto-refresh every 30 seconds
      const refreshInterval = setInterval(() => {
        console.log('🔄 [DashboardContext] Auto-refreshing dashboard data...');
        fetchDashboardData();
        fetchDonations();
      }, 30000); // 30 seconds

      // Refresh when user returns to tab
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('👁️ [DashboardContext] Tab visible, refreshing data...');
          fetchDashboardData();
          fetchDonations();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup
      return () => {
        clearInterval(refreshInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        console.log('🧹 [DashboardContext] Auto-refresh cleanup complete');
      };
    } else {
      console.log('⏭️ [DashboardContext] No authenticated user, skipping data fetch');
    }
  }, [user, authLoading]); // React to changes in user authentication state


  return (
    <DashboardContext.Provider
      value={{
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
        dataLoading, // Add loading state
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
};



