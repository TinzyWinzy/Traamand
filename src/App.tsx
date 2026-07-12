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
import MyReferrals from './pages/MyReferrals'
import ReferralLandingPage from './pages/ReferralLandingPage'
import VerifierTasks from './pages/verifier/VerifierTasks'
import CreatorDashboard from './pages/creator/CreatorDashboard'
import SponsorDashboard from './pages/sponsor/SponsorDashboard'
import AdvertiseDashboard from './pages/advertise/AdvertiseDashboard'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminWorkers from './pages/admin/workers/AdminWorkers'
import WorkerForm from './pages/admin/workers/WorkerForm'
import AdminClients from './pages/admin/clients/AdminClients'
import AdminBookings from './pages/admin/bookings/AdminBookings'
import AdminPayments from './pages/admin/payments/AdminPayments'
import AdminApplicants from './pages/admin/applicants/AdminApplicants'
import AdminUsers from './pages/admin/users/AdminUsers'
import AdminPayouts from './pages/admin/payouts/AdminPayouts'
import AdminCreatorSubmissions from './pages/admin/content/AdminCreatorSubmissions'
import AdminVerifierTasks from './pages/admin/tasks/AdminVerifierTasks'

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

function VerifierRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <AuthGuard requireRole="verifier" navigate={navigate}>
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
          <Route path="/r/:code" element={<ReferralLandingPage />} />
          <Route
            path="/verifier"
            element={
              <VerifierRoute>
                <VerifierTasks />
              </VerifierRoute>
            }
          />
          <Route
            path="/creator"
            element={
              <AuthRoute>
                <CreatorDashboard />
              </AuthRoute>
            }
          />
          <Route
            path="/sponsor"
            element={
              <AuthRoute>
                <SponsorDashboard />
              </AuthRoute>
            }
          />
          <Route
            path="/advertise"
            element={
              <AuthRoute>
                <AdvertiseDashboard />
              </AuthRoute>
            }
          />
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
            path="/my-referrals"
            element={
              <AuthRoute>
                <MyReferrals />
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
            <Route path="users" element={<AdminUsers />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="content" element={<AdminCreatorSubmissions />} />
            <Route path="tasks" element={<AdminVerifierTasks />} />
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
