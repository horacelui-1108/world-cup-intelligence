import { useParams } from 'react-router';
import StubPage from './StubPage';

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  return <StubPage title="Match Centre" caption={`比賽 ID:${matchId ?? ''} · 比分、事件時間軸、陣容及統計`} />;
}
