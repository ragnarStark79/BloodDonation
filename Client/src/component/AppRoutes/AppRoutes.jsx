import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '../Loginsignup/Login'
import Signup from '../Loginsignup/Signup'
import ForgotPassword from '../Loginsignup/ForgotPassword'
import NewHome from "../Homepage/NewHome"
import Donor from "../DonorDashboard/Donor"
import ProtectedRoute from './ProtectedRoute'
import OrgDashboard from '../Orgdashboard/Org' // Importing the new Org Layout as OrgDashboard
import AdminDashboard from '../Admindashboard/Admin' // Importing the new Admin Layout as AdminDashboard to avoid massive refactor of import name above

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* public */}
        <Route path='/' element={<NewHome />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />

        {/* protected */}
        <Route path='/donar-dashboard' element={<Navigate to="/donor" replace />} />
        <Route path='/donor/*' element={
          <ProtectedRoute allow={['DONOR', 'donor']}>
            <Donor />
          </ProtectedRoute>
        } />
        <Route path='/organization-dashboard' element={<Navigate to="/org" replace />} />
        <Route path='/org/*' element={
          <ProtectedRoute allow={['ORGANIZATION', 'hospital', 'bloodbank']}>
            <OrgDashboard />
          </ProtectedRoute>
        } />
        <Route path='/admin-dashboard' element={<Navigate to="/admin" replace />} />
        <Route path='/admin/*' element={
          <ProtectedRoute allow={['ADMIN', 'admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
