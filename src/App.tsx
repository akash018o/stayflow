import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RoomListingPage from './pages/RoomListingPage'
import RoomDetailPage from './pages/RoomDetailPage'
import OwnerDashboardPage from './pages/OwnerDashboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<RoomListingPage />} />
          <Route path="/rooms/:roomTypeId" element={<RoomDetailPage />} />
          <Route path="/owner" element={<OwnerDashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
