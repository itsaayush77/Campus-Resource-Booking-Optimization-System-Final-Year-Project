import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Dashboard from './pages/Dashboard'
import ResourcesList from './pages/resources/ResourcesList'
import BrowseResources from './pages/resources/BrowseResources'

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/browse-resources" element={<BrowseResources />} />
          <Route path="/resources/:type" element={<ResourcesList />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App