import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import VerificationPage from "./VerificationPage";
import AdminProfile from "./AdminProfile";
import AdminSettings from "./AdminSettings";
import RequestsMonitorPage from "./RequestsMonitorPage";

const Admin = () => {
  return (
    <div>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminDashboard />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="appointments" element={<AdminDashboard />} />
        <Route path="requests" element={<RequestsMonitorPage />} />
        <Route path="stock" element={<AdminDashboard />} />
        <Route path="reports" element={<AdminDashboard />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default Admin;
