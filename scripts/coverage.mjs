import { matches } from '../src/data/matches.ts';

const STAGE = { GROUP: '小組賽', R32: '三十二強', R16: '十六強', QF: '八強', SF: '四強', '3P': '季軍戰', F: '決賽' };
const rows = [['Match ID','階段','對賽','比數','球場','狀態','陣容','事件','入球者','統計','xG','賽後分析','Source URL','Data Status']];
const stat = { score:0, lineup:0, events:0, scorers:0, stats:0, xg:0, analysis:0, none:0 };
for (const m of matches.sort((a,b)=>a.matchId.localeCompare(b.matchId, undefined, {numeric:true}))) {
  const hasScore = m.status === 'ft' && m.score;
  const hasLineup = !!(m.lineups?.home?.starters?.length && m.lineups?.away?.starters?.length);
  const hasEvents = (m.events?.length ?? 0) > 0;
  const hasScorers = (m.scorers?.length ?? 0) > 0;
  const s = m.stats ?? {};
  const statKeys = ['possession','shots','shotsOnTarget','corners','fouls','offsides','passAccuracy','xg'].filter(k => s[k]);
  const hasStats = statKeys.length > 0;
  const hasXG = !!s.xg;
  const hasAnalysis = m.status === 'ft';
  if (hasScore) stat.score++;
  if (hasLineup) stat.lineup++;
  if (hasEvents) stat.events++;
  if (hasScorers) stat.scorers++;
  if (hasStats) stat.stats++;
  if (hasXG) stat.xg++;
  if (hasAnalysis) stat.analysis++;
  if (!hasEvents && !hasStats && !hasLineup) stat.none++;
  rows.push([m.matchId, STAGE[m.stage] ?? m.stage, `${m.homeTeamId} vs ${m.awayTeamId}`, hasScore ? `${m.score.home}–${m.score.away}${m.score.extraTime?'(加時)':''}${m.score.penalties?`(十二碼${m.score.penalties.home}–${m.score.penalties.away})`:''}` : '—',
    m.venueId, m.status.toUpperCase(), hasLineup?'Y':'—', hasEvents?`Y(${m.events.length})`:'—', hasScorers?`Y(${m.scorers.length})`:'—',
    hasStats?`Y(${statKeys.join(',')})`:'—', hasXG?'Y':'—', hasAnalysis?'Y':'—',
    m.source?.sourceUrl ?? '', m.source?.dataStatus ?? '']);
}
console.log(rows.map(r => r.map(c => `"${String(c).replaceAll('"','""')}"`).join(',')).join('\n'));
console.error('SUMMARY ' + JSON.stringify(stat));
