import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Notifications from './pages/Notifications'
import Path from './pages/Path'
import Fuel from './pages/Fuel'
import Chat from './pages/Chat'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 90 }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/path" element={<Path />} />
        <Route path="/fuel" element={<Fuel />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
