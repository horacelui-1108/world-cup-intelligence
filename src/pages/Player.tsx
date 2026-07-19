import { useParams } from 'react-router';
import StubPage from './StubPage';

export default function Player() {
  const { playerId } = useParams<{ playerId: string }>();
  return <StubPage title="球員" caption={`球員 ID:${playerId ?? ''} · 統計、逐場紀錄、入球及助攻`} />;
}
