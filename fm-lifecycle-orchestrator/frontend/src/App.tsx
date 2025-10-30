import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import ClientDetail from './pages/ClientDetail'
import RegulatoryDueDiligence from './pages/RegulatoryDueDiligence'
import ClassificationRules from './pages/ClassificationRules'
import Clients from './pages/Clients'
import Tasks from './pages/Tasks'
import Settings from './pages/Settings'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/client/:clientId" element={<ClientDetail />} />
            <Route path="/regulatory-due-diligence" element={<RegulatoryDueDiligence />} />
            <Route path="/classification-rules" element={<ClassificationRules />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
