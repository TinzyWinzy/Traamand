import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import WhatsAppWidget from './components/whatsapp/WhatsAppWidget'
import Home from './pages/Home'
import FindMaid from './pages/FindMaid'
import JoinTeam from './pages/JoinTeam'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-navy flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/find-a-maid" element={<FindMaid />} />
          <Route path="/join-our-team" element={<JoinTeam />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
