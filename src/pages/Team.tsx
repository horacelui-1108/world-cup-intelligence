import { useParams } from 'react-router';
import StubPage from './StubPage';

export default function Team() {
  const { teamId } = useParams<{ teamId: string }>();
  return <StubPage title="球隊" caption={`球隊 ID:${teamId ?? ''} · 資料、名單、表現及相關分析`} />;
}
