import { createContext, useContext, useState, useEffect, useMemo } from "react";
import client from "../api/client";
import adminApi from "../api/adminApi";

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {

  // Ensure children is valid
  if (!children) {
    console.error("DashboardProvider: No children provided");
    return null;
  }
  // Stock: { "O+": { units: 150, reserved: 10 }, "A+": { units: 120, reserved: 5 }, ... }
  const [stock, setStock] = useState({
    "O+": { units: 320, reserved: 10 },
    "O-": { units: 45, reserved: 2 },
    "A+": { units: 280, reserved: 8 },
    "A-": { units: 35, reserved: 1 },
    "B+": { units: 180, reserved: 5 },
    "B-": { units: 25, reserved: 0 },
    "AB+": { units: 95, reserved: 3 },
    "AB-": { units: 15, reserved: 0 },
  });

  // Monthly donations: array of 12 values (Jan-Dec)
  const [monthlyDonations, setMonthlyDonations] = useState([
    20, 18, 22, 25, 28, 30, 32, 35, 48, 42, 38, 45,
  ]);

  // Donation pipeline columns (Kanban)
  const [donationColumns, setDonationColumns] = useState({
    "new-donors": {
      id: "new-donors",
      title: "NEW DONORS",
      color: "from-red-50 to-red-100/50",
      items: [
        { id: "d-1", name: "Bella Gomez", group: "A+", date: "2024-11-28" },
      ],
    },
    screening: {
      id: "screening",
      title: "SCREENING",
      color: "from-blue-50 to-blue-100/50",
      items: [
        { id: "d-2", name: "Maya Patel", group: "B+", date: "2024-11-27" },
      ],
    },
    "in-progress": {
      id: "in-progress",
      title: "DONATION IN PROGRESS",
      color: "from-yellow-50 to-yellow-100/50",
      items: [{ id: "d-3", name: "John Lee", group: "O-", date: "2024-11-30" }],
    },
    completed: {
      id: "completed",
      title: "COMPLETED DONATIONS",
      color: "from-green-50 to-green-100/50",
      items: [
        { id: "d-4", name: "Sara Khan", group: "A+", date: "2024-10-05" },
      ],
    },
    "ready-storage": {
      id: "ready-storage",
      title: "READY FOR STORAGE",
      color: "from-slate-50 to-slate-100/50",
      items: [
        { id: "d-5", name: "Arun Roy", group: "AB+", date: "2024-10-01" },
      ],
    },
  });

  // Users
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "Donor",
      status: "Active",
      avatar: "JD",
      lastActive: "2h ago",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Admin",
      status: "Active",
      avatar: "JS",
      lastActive: "1h ago",
    },
    {
      id: 3,
      name: "Bob Wilson",
      email: "bob@example.com",
      role: "Volunteer",
      status: "Offline",
      avatar: "BW",
      lastActive: "1d ago",
    },
  ]);

  // Appointments
  const [appointments, setAppointments] = useState([
    {
      id: "a-1",
      name: "Alice Brown",
      group: "O+",
      date: "2024-12-15",
      time: "10:00",
      email: "alice@example.com",
      phone: "123-456-7890",
      status: "Scheduled",
      notes: "",
    },
  ]);

  // Requests
  const [requests, setRequests] = useState([
    {
      id: "r-1",
      hospital: "City Hospital",
      group: "O+",
      units: 5,
      date: "2024-12-10",
      urgency: "High",
      contact: "contact@hospital.com",
      status: "Pending",
      notes: "",
    },
  ]);

  // Request pipeline columns
  const [requestColumns, setRequestColumns] = useState({
    pending: { id: "pending", title: "Pending", items: ["r-1"] },
    verified: { id: "verified", title: "Verified", items: [] },
    approved: { id: "approved", title: "Approved", items: [] },
    rejected: { id: "rejected", title: "Rejected", items: [] },
  });

  // Settings
  const [settings, setSettings] = useState({
    threshold: 20,
    autoApprove: false,
    notifications: { lowStock: true },
    profile: { name: "Ashika", email: "admin@liforce.com" },
  });

  // Computed: total units
  const totalUnits = useMemo(() => {
    return Object.values(stock).reduce((sum, s) => sum + (s.units || 0), 0);
  }, [stock]);

  const fetchDashboardData = async () => {
    try {
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
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };


  // Fetch data from backend on mount - ONLY if user has an auth token
  useEffect(() => {
    // Only fetch if there's an access token (user is logged in)
    const token = localStorage.getItem('accessToken');

    if (token) {
      console.log('📊 [DashboardContext] Token found, fetching dashboard data');
      fetchDashboardData();
    } else {
      console.log('⏭️ [DashboardContext] No token found, skipping data fetch');
    }
  }, []); // Empty dependency array - only run on mount


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



