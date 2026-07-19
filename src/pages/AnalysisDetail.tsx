import { useParams } from 'react-router';
import StubPage from './StubPage';

export default function AnalysisDetail() {
  const { slug } = useParams<{ slug: string }>();
  return <StubPage title="分析文章" caption={`文章:${slug ?? ''} · 摘要、完整分析、戰術及來源清單`} />;
}
