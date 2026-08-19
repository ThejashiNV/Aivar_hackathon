import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ActionFeed from './pages/ActionFeed';
import ActionDetail from './pages/ActionDetail';
import ReviewQueue from './pages/ReviewQueue';
import Agents from './pages/Agents';
import AgentDetail from './pages/AgentDetail';
import Demo from './pages/Demo';
import PolicySettings from './pages/PolicySettings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/actions" element={<ActionFeed />} />
          <Route path="/actions/:id" element={<ActionDetail />} />
          <Route path="/reviews" element={<ReviewQueue />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/:id" element={<AgentDetail />} />
          <Route path="/policy" element={<PolicySettings />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
