import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

import Welcome from './pages/Welcome'
import PageBruteForce from './pages/PageBruteForce'
import Page7Cipher from './pages/Page7Cipher'
import PageVPN from './pages/PageVPN'
import PageDDoS from './pages/PageDDoS'
import PagePasswordGenerator from './pages/PagePasswordGenerator'
import PagePhishing from './pages/PagePhishing'
import PageRansomware from './pages/PageRansomware'
import PageWifiSniff from './pages/PageWifiSniff'
import PageLinuxHub from './pages/PageLinuxHub'
import PageLxTerminal from './pages/PageLxTerminal'
import PageLxFs from './pages/PageLxFs'
import PageLxGobuster from './pages/PageLxGobuster'
import PageLxHydra from './pages/PageLxHydra'
import PageLxChallenge from './pages/PageLxChallenge'
import PageTesting from './pages/PageTesting'
import PageRansomwareGame from './pages/PageRansomwareGame'
import PagePlay from './quiz/PagePlay'
import PageHost from './quiz/PageHost'
import PageXO from './games/PageXO'
import PageMemory from './games/PageMemory'

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: '#FCF5F0' }}>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/brute-force" element={<PageBruteForce />} />
        <Route path="/page7" element={<Page7Cipher />} />
        <Route path="/vpn" element={<PageVPN />} />
        <Route path="/dos" element={<PageDDoS />} />
        <Route path="/password-gen" element={<PagePasswordGenerator />} />
        <Route path="/phishing" element={<PagePhishing />} />
        <Route path="/ransomware" element={<PageRansomware />} />
        <Route path="/wifi-sniff" element={<PageWifiSniff />} />
        <Route path="/linux" element={<PageLinuxHub />} />
        <Route path="/lx-terminal" element={<PageLxTerminal />} />
        <Route path="/lx-fs" element={<PageLxFs />} />
        <Route path="/lx-gobuster" element={<PageLxGobuster />} />
        <Route path="/lx-hydra" element={<PageLxHydra />} />
        <Route path="/lx-challenge" element={<PageLxChallenge />} />
        {/* ── Live Quiz (Kahoot-style): attendees join, trainer hosts ── */}
        <Route path="/play" element={<PagePlay />} />
        <Route path="/host" element={<PageHost />} />
        {/* ── Team games (client-side, played on the projected screen) ── */}
        <Route path="/games/xo" element={<PageXO />} />
        <Route path="/games/memory" element={<PageMemory />} />
        {/* ── Hidden testing area (not shown on the main lessons page) ── */}
        <Route path="/testing" element={<PageTesting />} />
        <Route path="/testing/ransomware" element={<PageRansomwareGame />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}
