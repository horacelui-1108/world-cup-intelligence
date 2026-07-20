/**
 * 賽事重要消息（12 條）— 全部基於 data-research-brief.md 已核實事實。
 * 每條帶 SourceMeta（ESPN/AP/Olympics sourceUrl，VERIFIED；決賽前消息保留 PENDING 原狀）。
 */
import type { NewsItem, SourceMeta } from '../types/football';
import { ESPN_VERIFIED } from './matches';

const src = (overrides?: Partial<SourceMeta>): SourceMeta => ({ ...ESPN_VERIFIED, ...overrides });

/** 決賽後消息統一擷取時間 */
const FINAL_RETIEVED = '2026-07-20T00:00:00Z';

export const news: NewsItem[] = [
  {
    id: 'n8',
    title: '西班牙加時 1–0 勝阿根廷，奪隊史第二座世界盃',
    summary:
      '2026 世界盃決賽，西班牙憑費蘭·托利斯（Ferran Torres）106 分鐘加時入球，1–0 擊敗衛冕嘅阿根廷，' +
      '奪得隊史第二座世界盃冠軍。阿根廷嘅安素·費南迪斯補時兩黃一紅被逐。',
    publishedAt: '2026-07-19T23:05:00Z',
    source: src({
      source: 'AP',
      sourceUrl: 'https://apnews.com/hub/fifa-world-cup',
      retrievedAt: FINAL_RETIEVED,
    }),
  },
  {
    id: 'n9',
    title: '世界盃頒獎：洛迪奪金球獎、烏尼·施蒙獲金手套、古巴斯最佳年青球員',
    summary:
      '頒獎禮公布：Golden Ball 洛迪（西班牙）、Silver Ball 美斯（阿根廷）、Bronze Ball 麥巴比（法國）；' +
      'Golden Glove 烏尼·施蒙（西班牙，8 場 7 次零封僅失 1 球）；最佳年青球員柏奧·古巴斯（西班牙）。',
    publishedAt: '2026-07-19T23:20:00Z',
    source: src({
      source: 'Olympics.com',
      sourceUrl: 'https://www.olympics.com/en/news/football',
      retrievedAt: FINAL_RETIEVED,
    }),
  },
  {
    id: 'n10',
    title: '麥巴比 10 球奪金靴：首位兩奪世界盃金靴',
    summary:
      '麥巴比（Kylian Mbappé）以 10 球奪得今屆 Golden Boot，成為首位兩奪世界盃金靴嘅球員；' +
      '佢嘅世界盃總入球達 22 球，刷新紀錄。',
    publishedAt: '2026-07-19T23:35:00Z',
    source: src({ retrievedAt: FINAL_RETIEVED }),
  },
  {
    id: 'n11',
    title: '西班牙冠軍之路寫多項紀錄：8 場僅失 1 球、38 場不敗',
    summary:
      '西班牙今屆 8 場僅失 1 球，創冠軍球隊最少失球紀錄，全屆未曾落後；各項賽事 38 場不敗，' +
      '為歐洲男子國家隊最長不敗紀錄。迪拉富恩迪（Luis de la Fuente）成為最老嘅世界盃冠軍教練。',
    publishedAt: '2026-07-19T23:50:00Z',
    source: src({ retrievedAt: FINAL_RETIEVED }),
  },
  {
    id: 'n12',
    title: 'E.馬天尼斯決賽 11 次撲救創紀錄，仍難救阿根廷',
    summary:
      '阿根廷門將艾米利安奴·馬天尼斯（Emiliano Martínez）決賽作出 11 次撲救，創世界盃決賽單場撲救紀錄，' +
      '但阿根廷加時仍 0–1 不敵西班牙，衛冕失敗。',
    publishedAt: '2026-07-19T23:55:00Z',
    source: src({ retrievedAt: FINAL_RETIEVED }),
  },
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
