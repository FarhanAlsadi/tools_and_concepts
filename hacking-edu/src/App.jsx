import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
import Welcome from './pages/Welcome'
import Page1Components from './pages/Page1Components'
import Page2Routes from './pages/Page2Routes'
import Page3ClientServer from './pages/Page3ClientServer'
import Page3Terminal from './pages/Page3Terminal'
import Page4IDOR from './pages/Page4IDOR'
import Page5Defense from './pages/Page5Defense'
import Page7Cipher from './pages/Page7Cipher'
import PageTerminalIntro from './pages/PageTerminalIntro'
import PageFirewall from './pages/PageFirewall'
import PageDNS from './pages/PageDNS'
import PageDNSLab from './pages/PageDNSLab'
import PageDHCP from './pages/PageDHCP'
import PageIPAddress from './pages/PageIPAddress'
import PageDNSSpoofing from './pages/PageDNSSpoofing'
import PageSIEM from './pages/PageSIEM'
import PageQuiz from './pages/PageQuiz'
import PageBarq from './pages/PageBarq'
import PageTerminalLab from './pages/PageTerminalLab'
import PageVPN from './pages/PageVPN'
import PageIPMasking from './pages/PageIPMasking'
import PageLinuxFS from './pages/PageLinuxFS'
import PageDDoS from './pages/PageDDoS'
import PageMindGames from './pages/PageMindGames'
import PageFinalChallenge from './pages/PageFinalChallenge'
import PagePasswordGenerator from './pages/PagePasswordGenerator'
import PageAntivirus from './pages/PageAntivirus'
import PageNmap from './pages/PageNmap'
import PageSOCLab from './pages/PageSOCLab'
import PageDDoSLab from './pages/PageDDoSLab'
import PageLinuxHub from './pages/PageLinuxHub'
import PageLxTerminal from './pages/PageLxTerminal'
import PageLxFs from './pages/PageLxFs'
import PageLxGobuster from './pages/PageLxGobuster'
import PageLxHydra from './pages/PageLxHydra'
import PageLxChallenge from './pages/PageLxChallenge'
import PageSQLi from './pages/PageSQLi'
import PageDatabase from './pages/PageDatabase'
import PagePath from './pages/PagePath'
import PageViewSource from './pages/PageViewSource'
import PageBruteForce from './pages/PageBruteForce'
import PageMacSpoofing from './pages/PageMacSpoofing'
import PagePhishing from './pages/PagePhishing'
import PageRansomware from './pages/PageRansomware'
import PageXSS from './pages/PageXSS'
import PageExif from './pages/PageExif'
import PageDorking from './pages/PageDorking'
import PageIpMac from './pages/PageIpMac'
import PageCookies from './pages/PageCookies'
import PageCSRF from './pages/PageCSRF'
import PageFTP from './pages/PageFTP'

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: '#FCF5F0' }}>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/path/:pathId" element={<PagePath />} />
        <Route path="/page1" element={<Page1Components />} />
        <Route path="/page2" element={<Page3ClientServer />} />
        <Route path="/page3" element={<Page2Routes />} />
        <Route path="/page4" element={<Page3Terminal />} />
        <Route path="/page5" element={<Page4IDOR />} />
        <Route path="/page6" element={<Page5Defense />} />
        <Route path="/page7" element={<Page7Cipher />} />
        <Route path="/terminal" element={<PageTerminalIntro />} />
        <Route path="/firewall" element={<PageFirewall />} />
        <Route path="/dns" element={<PageDNS />} />
        <Route path="/dns-lab" element={<PageDNSLab />} />
        <Route path="/dhcp" element={<PageDHCP />} />
        <Route path="/ip" element={<PageIPAddress />} />
        <Route path="/dns-spoofing" element={<PageDNSSpoofing />} />
        <Route path="/siem" element={<PageSIEM />} />
        <Route path="/quiz" element={<PageQuiz />} />
        <Route path="/barq" element={<PageBarq />} />
        <Route path="/terminal-lab" element={<PageTerminalLab />} />
        <Route path="/vpn" element={<PageVPN />} />
        <Route path="/ip-masking" element={<PageIPMasking />} />
        <Route path="/linux-fs" element={<PageLinuxFS />} />
        <Route path="/dos" element={<PageDDoS />} />
        <Route path="/mind-games" element={<PageMindGames />} />
        <Route path="/challenge" element={<PageFinalChallenge />} />
        <Route path="/password-gen" element={<PagePasswordGenerator />} />
        <Route path="/antivirus" element={<PageAntivirus />} />
        <Route path="/nmap" element={<PageNmap />} />
        <Route path="/soc" element={<PageSOCLab />} />
        <Route path="/dos-lab" element={<PageDDoSLab />} />
        <Route path="/linux" element={<PageLinuxHub />} />
        <Route path="/lx-terminal" element={<PageLxTerminal />} />
        <Route path="/lx-fs" element={<PageLxFs />} />
        <Route path="/lx-gobuster" element={<PageLxGobuster />} />
        <Route path="/lx-hydra" element={<PageLxHydra />} />
        <Route path="/lx-challenge" element={<PageLxChallenge />} />
        <Route path="/database" element={<PageDatabase />} />
        <Route path="/sqli" element={<PageSQLi />} />
        <Route path="/view-source" element={<PageViewSource />} />
        <Route path="/brute-force" element={<PageBruteForce />} />
        <Route path="/mac-spoofing" element={<PageMacSpoofing />} />
        <Route path="/phishing" element={<PagePhishing />} />
        <Route path="/ransomware" element={<PageRansomware />} />
        <Route path="/xss" element={<PageXSS />} />
        <Route path="/exif" element={<PageExif />} />
        <Route path="/dorking" element={<PageDorking />} />
        <Route path="/ip-mac" element={<PageIpMac />} />
        <Route path="/cookies" element={<PageCookies />} />
        <Route path="/csrf" element={<PageCSRF />} />
        <Route path="/ftp" element={<PageFTP />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}
