/**
 * 賽事重要消息（7 條）— 全部基於 data-research-brief.md 已核實事實。
 * 每條帶 SourceMeta（ESPN sourceUrl，VERIFIED；決賽消息 PENDING）。
 */
import type { NewsItem, SourceMeta } from '../types/football';
import { ESPN_VERIFIED } from './matches';

const src = (overrides?: Partial<SourceMeta>): SourceMeta => ({ ...ESPN_VERIFIED, ...overrides });

export const news: NewsItem[] = [
  {
    id: 'n1',
    title: '決賽今日舉行：西班牙 vs 阿根廷',
    summary:
      '2026 世界盃決賽今日（7 月 19 日）喺 MetLife Stadium 舉行，美國東岸時間下午 3 時（UTC 19:00）開波。' +
      '衛冕嘅阿根廷迎戰歐洲冠軍西班牙；西班牙今屆保持不敗，阿根廷則尋求成功衛冕。',
    publishedAt: '2026-07-19T08:00:00Z',
    source: src({ dataStatus: 'PENDING' }),
  },
  {
    id: 'n2',
    title: '季軍戰 10 球大戰：英格蘭 6–4 法國奪季',
    summary:
      '英格蘭喺邁阿密舉行嘅季軍戰以 6–4 擊敗法國，全場合共 10 個入球，英格蘭奪得今屆季軍。',
    publishedAt: '2026-07-18T23:30:00Z',
    source: src(),
  },
  {
    id: 'n3',
    title: '迪甘斯告別法國',
    summary:
      '季軍戰 4–6 不敵英格蘭一役成為迪甘斯（Didier Deschamps）執教法國嘅告別戰。',
    publishedAt: '2026-07-18T23:45:00Z',
    source: src(),
  },
  {
    id: 'n4',
    title: 'C.朗拿度最後一場世界盃',
    summary:
      '葡萄牙喺 16 強 0–1 不敵西班牙出局，馬連奴補時 90+1 分鐘奠勝；呢場亦係 C.朗拿度（Cristiano Ronaldo）最後一場世界盃賽事。',
    publishedAt: '2026-07-06T21:00:00Z',
    source: src(),
  },
  {
    id: 'n5',
    title: '射手榜爭奪：麥巴比、美斯同入 8 球迎決賽',
    summary:
      '準決賽後射手榜：麥巴比（法國）8 球、美斯（阿根廷）8 球兼 4 助攻、夏蘭特（挪威）7 球、簡尼（英格蘭）6 球、比寧咸（英格蘭）6 球。' +
      '美斯喺決賽同麥巴比直接爭奪金靴。',
    publishedAt: '2026-07-16T09:00:00Z',
    source: src(),
  },
  {
    id: 'n6',
    title: '阿根廷衛冕之路：逆轉埃及、加時挫瑞士、補時反勝英格蘭',
    summary:
      '阿根廷 16 強落後 0–2 下 3–2 逆轉埃及（賽事有 VAR 爭議），八強加時 3–1 勝瑞士（對方安保路紅牌），' +
      '四強憑美斯兩次助攻，安素·費南迪斯 85 分鐘及拿達路·馬天尼斯 90+2 分鐘建功，2–1 反勝英格蘭入決賽。',
    publishedAt: '2026-07-16T10:00:00Z',
    source: src(),
  },
  {
    id: 'n7',
    title: '西班牙淘汰賽全勝晉級決賽',
    summary:
      '西班牙淘汰賽先後擊敗奧地利（3–0）、葡萄牙（1–0）、比利時（2–1）及法國（2–0），' +
      '四強奧耶沙巴 22 分鐘射入十二碼、樸路 58 分鐘建功，以淘汰賽全勝姿態殺入決賽。',
    publishedAt: '2026-07-15T22:30:00Z',
    source: src(),
  },
];

export function getNewsById(id: string): NewsItem | undefined {
  return news.find((n) => n.id === id);
}
