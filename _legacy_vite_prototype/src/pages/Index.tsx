import { useRole } from '@/context/AuthContext';
import FounderDashboard from './dashboards/FounderDashboard';
import TeamLeadDashboard from './dashboards/TeamLeadDashboard';
import InternDashboard from './dashboards/InternDashboard';

export default function Index() {
  const { currentRole } = useRole();

  if (currentRole === 'founder') return <FounderDashboard />;
  if (currentRole === 'teamlead') return <TeamLeadDashboard />;
  return <InternDashboard />;
}
