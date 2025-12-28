import { useState, useEffect } from "react";
import client from "../../api/client";
import { toast } from "sonner";
import AddInventory from "./AddInventory";
import CreateRequest from "./CreateRequest";
import IncomingRequestsTab from "./IncomingRequestsTab";
import AppointmentsTab from "./AppointmentsTab";
import CampsTab from "./CampsTab";
import OrgOverview from "./OrgOverview";

const StatCard = ({ label, value }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
  </div>
);

const OrgDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ availableUnits: 0, expiringSoon: 0, openRequests: 0, upcomingAppts: 0 });
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    fetchStats();
    if (activeTab === "inventory") fetchInventory();
    if (activeTab === "requests") fetchRequests();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await client.get("/api/org/stats");
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchInventory = async () => {
    try {
      const res = await client.get("/api/org/inventory");
      setInventory(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchRequests = async () => {
    try {
      const res = await client.get("/api/org/requests");
      setRequests(res.data || []);
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "inventory", label: "Blood Inventory" },
    { id: "requests", label: "My Requests" },
    { id: "incoming", label: "Incoming Requests" },
    { id: "appointments", label: "Appointments" },
    { id: "camps", label: "Camps" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Organization Dashboard</h1>
        <p className="text-gray-600">Manage operations for {stats.organizationName || "Hospital/Bank"}.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Available Units" value={stats.availableUnits || 0} />
        <StatCard label="Expiring Soon" value={stats.expiringSoon || 0} />
        <StatCard label="Open Requests" value={stats.openRequests || 0} />
        <StatCard label="Upcoming Appts" value={stats.upcomingAppts || 0} />
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === "overview" && <OrgOverview />}

        {activeTab === "inventory" && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Inventory Management</h2>
              <button onClick={() => setShowInventoryForm(!showInventoryForm)} className="text-red-600 font-medium">
                {showInventoryForm ? "Close Form" : "Add Unit"}
              </button>
            </div>
            {showInventoryForm && <AddInventory onAdded={(item) => setInventory([...inventory, item])} />}

            <table className="w-full text-sm mt-4">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr><th className="p-2">Group</th><th className="p-2">Component</th><th className="p-2">Expiry</th><th className="p-2">Status</th></tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item._id} className="border-t">
                    <td className="p-2 font-bold">{item.bloodGroup}</td>
                    <td className="p-2">{item.component}</td>
                    <td className="p-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
                    <td className="p-2">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">My Funding Requests</h2>
              <button onClick={() => setShowRequestForm(!showRequestForm)} className="text-red-600 font-medium">
                {showRequestForm ? "Close Form" : "Create Request"}
              </button>
            </div>
            {showRequestForm && <CreateRequest onCreated={(r) => setRequests([...requests, r])} />}

            <table className="w-full text-sm mt-4">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr><th className="p-2">Group</th><th className="p-2">Units</th><th className="p-2">Urgency</th><th className="p-2">Status</th></tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req._id} className="border-t">
                    <td className="p-2 font-bold">{req.bloodGroup}</td>
                    <td className="p-2">{req.units}</td>
                    <td className="p-2 text-red-600 font-medium">{req.urgency}</td>
                    <td className="p-2">{req.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "incoming" && <IncomingRequestsTab />}

        {activeTab === "appointments" && <AppointmentsTab />}

        {activeTab === "camps" && <CampsTab />}
      </div>
    </div>
  );
};

export default OrgDashboard;
