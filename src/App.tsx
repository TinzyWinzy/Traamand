import { lazy, Suspense } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import WhatsAppWidget from './components/whatsapp/WhatsAppWidget'
import PWAPrompt from './components/pwa/PWAPrompt'
import ErrorBoundary from './components/ui/ErrorBoundary'
import ToastContainer from './components/ui/Toast'
import { AuthListener, AuthGuard } from './components/auth/AuthGuard'

const AvailableStaff = lazy(() => import('./pages/AvailableStaff'))
const FindMaid = lazy(() => import('./pages/FindMaid'))
const JoinTeam = lazy(() => import('./pages/JoinTeam'))
const NotFound = lazy(() => import('./pages/NotFound'))
const SignIn = lazy(() => import('./pages/SignIn'))
const HomePage = lazy(() => import('./pages/hire/EmergencyHire'))
const WorkerList = lazy(() => import('./pages/hire/WorkerList'))
const BookingFormPage = lazy(() => import('./pages/hire/BookingFormPage'))
const BookingConfirmation = lazy(() => import('./pages/hire/BookingConfirmation'))
const WorkerProfile = lazy(() => import('./pages/worker/WorkerProfile'))
const MyHires = lazy(() => import('./pages/my-hires/MyHires'))
const MyReferrals = lazy(() => import('./pages/MyReferrals'))
const ReferralLandingPage = lazy(() => import('./pages/ReferralLandingPage'))
const VerifierTasks = lazy(() => import('./pages/verifier/VerifierTasks'))
const CreatorDashboard = lazy(() => import('./pages/creator/CreatorDashboard'))
const SponsorDashboard = lazy(() => import('./pages/sponsor/SponsorDashboard'))
const AdvertiseDashboard = lazy(() => import('./pages/advertise/AdvertiseDashboard'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminWorkers = lazy(() => import('./pages/admin/workers/AdminWorkers'))
const WorkerForm = lazy(() => import('./pages/admin/workers/WorkerForm'))
const AdminClients = lazy(() => import('./pages/admin/clients/AdminClients'))
const AdminBookings = lazy(() => import('./pages/admin/bookings/AdminBookings'))
const AdminPayments = lazy(() => import('./pages/admin/payments/AdminPayments'))
const AdminApplicants = lazy(() => import('./pages/admin/applicants/AdminApplicants'))
const AdminUsers = lazy(() => import('./pages/admin/users/AdminUsers'))
const AdminPayouts = lazy(() => import('./pages/admin/payouts/AdminPayouts'))
const AdminCreatorSubmissions = lazy(() => import('./pages/admin/content/AdminCreatorSubmissions'))
const AdminVerifierTasks = lazy(() => import('./pages/admin/tasks/AdminVerifierTasks'))
const AdminSignIn = lazy(() => import('./pages/admin/AdminSignIn'))
const VerifierSignIn = lazy(() => import('./pages/verifier/VerifierSignIn'))
const CreatorSignIn = lazy(() => import('./pages/creator/CreatorSignIn'))
const SponsorSignIn = lazy(() => import('./pages/sponsor/SponsorSignIn'))
const AdvertiseSignIn = lazy(() => import('./pages/advertise/AdvertiseSignIn'))
const ApplicantSignIn = lazy(() => import('./pages/applicant/ApplicantSignIn'))
const ApplicantDashboard = lazy(() => import('./pages/applicant/ApplicantDashboard'))
const ClientDashboard = lazy(() => import('./pages/client/ClientDashboard'))

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

function ApplicantRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <AuthGuard requireRole="applicant" navigate={navigate}>
      {children}
    </AuthGuard>
  )
}

function ClientRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <AuthGuard requireRole="client" navigate={navigate}>
      {children}
    </AuthGuard>
  )
}

function CreatorRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <AuthGuard requireRole="creator" navigate={navigate}>
      {children}
    </AuthGuard>
  )
}

function SponsorRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <AuthGuard requireRole="sponsor" navigate={navigate}>
      {children}
    </AuthGuard>
  )
}

function AdvertiseRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <AuthGuard requireRole="advertise" navigate={navigate}>
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
        <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-slate-500">Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/available-staff" element={<AvailableStaff />} />
          <Route path="/find-a-maid" element={<FindMaid />} />
          <Route path="/join-our-team" element={<JoinTeam />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/admin/sign-in" element={<AdminSignIn />} />
          <Route path="/verifier/sign-in" element={<VerifierSignIn />} />
          <Route path="/creator/sign-in" element={<CreatorSignIn />} />
          <Route path="/sponsor/sign-in" element={<SponsorSignIn />} />
          <Route path="/advertise/sign-in" element={<AdvertiseSignIn />} />
          <Route path="/applicant/sign-in" element={<ApplicantSignIn />} />
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
              <CreatorRoute>
                <CreatorDashboard />
              </CreatorRoute>
            }
          />
          <Route
            path="/sponsor"
            element={
              <SponsorRoute>
                <SponsorDashboard />
              </SponsorRoute>
            }
          />
          <Route
            path="/advertise"
            element={
              <AdvertiseRoute>
                <AdvertiseDashboard />
              </AdvertiseRoute>
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
            path="/applicant"
            element={
              <ApplicantRoute>
                <ApplicantDashboard />
              </ApplicantRoute>
            }
          />
          <Route
            path="/client"
            element={
              <ClientRoute>
                <ClientDashboard />
              </ClientRoute>
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
          <Route path="/admin/sign-in" element={<AdminSignIn />} />
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
        </Suspense>
      </main>
      <Footer />
      <WhatsAppWidget />
      <PWAPrompt />
    </div>
    </ErrorBoundary>
  )
}
