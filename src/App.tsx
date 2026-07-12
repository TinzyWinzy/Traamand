import { Routes, Route, useNavigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import WhatsAppWidget from './components/whatsapp/WhatsAppWidget'
import PWAPrompt from './components/pwa/PWAPrompt'
import ErrorBoundary from './components/ui/ErrorBoundary'
import ToastContainer from './components/ui/Toast'
import { AuthListener, AuthGuard } from './components/auth/AuthGuard'

import AvailableStaff from './pages/AvailableStaff'
import FindMaid from './pages/FindMaid'
import JoinTeam from './pages/JoinTeam'
import NotFound from './pages/NotFound'
import SignIn from './pages/SignIn'
import HomePage from './pages/hire/EmergencyHire'
import WorkerList from './pages/hire/WorkerList'
import BookingFormPage from './pages/hire/BookingFormPage'
import BookingConfirmation from './pages/hire/BookingConfirmation'
import WorkerProfile from './pages/worker/WorkerProfile'
import MyHires from './pages/my-hires/MyHires'
import MyApplication from './pages/my-application/MyApplication'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminWorkers from './pages/admin/workers/AdminWorkers'
import WorkerForm from './pages/admin/workers/WorkerForm'
import AdminClients from './pages/admin/clients/AdminClients'
import AdminBookings from './pages/admin/bookings/AdminBookings'
import AdminPayments from './pages/admin/payments/AdminPayments'
import AdminApplicants from './pages/admin/applicants/AdminApplicants'

function AuthRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return <AuthGuard navigate={navigate}>{children}</AuthGuard>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <AuthGuard requireRole="admin" navigate={navigate}>
      {children}
    </AuthGuard>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-zinc-50 text-slate-900 flex flex-col">
      <AuthListener />
      <Navbar />
      <ToastContainer />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/available-staff" element={<AvailableStaff />} />
          <Route path="/find-a-maid" element={<FindMaid />} />
          <Route path="/join-our-team" element={<JoinTeam />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/hire/:category" element={<WorkerList />} />
          <Route path="/worker/:slug" element={<WorkerProfile />} />
          <Route path="/book/:slug" element={<BookingFormPage />} />
          <Route path="/book/:slug/confirmation" element={<BookingConfirmation />} />
          <Route
            path="/my-hires"
            element={
              <AuthRoute>
                <MyHires />
              </AuthRoute>
            }
          />
          <Route
            path="/my-application"
            element={
              <AuthRoute>
                <MyApplication />
              </AuthRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="applicants" element={<AdminApplicants />} />
            <Route path="workers" element={<AdminWorkers />} />
            <Route path="workers/new" element={<WorkerForm />} />
            <Route path="workers/:id" element={<WorkerForm />} />
            <Route path="workers/:id/edit" element={<WorkerForm />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="payments" element={<AdminPayments />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppWidget />
      <PWAPrompt />
    </div>
    </ErrorBoundary>
  )
}
