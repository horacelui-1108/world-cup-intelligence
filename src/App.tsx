import { Routes, Route } from 'react-router';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Schedule from '@/pages/Schedule';
import MatchDetail from '@/pages/MatchDetail';
import Standings from '@/pages/Standings';
import Bracket from '@/pages/Bracket';
import Team from '@/pages/Team';
import Player from '@/pages/Player';
import Analysis from '@/pages/Analysis';
import AnalysisDetail from '@/pages/AnalysisDetail';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="matches/:matchId" element={<MatchDetail />} />
        <Route path="standings" element={<Standings />} />
        <Route path="bracket" element={<Bracket />} />
        <Route path="teams/:teamId" element={<Team />} />
        <Route path="players/:playerId" element={<Player />} />
        <Route path="analysis" element={<Analysis />} />
        <Route path="analysis/:slug" element={<AnalysisDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
