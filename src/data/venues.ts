/**
 * 16 個比賽球場 — 2026 FIFA 世界盃（美加墨）
 * 球場英文名 + 繁中城市名；容量為約數（brief 標示可信度中）。
 */
import type { Venue } from '../types/football';

export const venues: Venue[] = [
  { id: 'azteca', stadium: 'Estadio Azteca', city: '墨西哥城', country: '墨西哥', capacity: 83000 },
  { id: 'metlife', stadium: 'MetLife Stadium', city: '東盧瑟福', country: '美國', capacity: 82500 },
  { id: 'att', stadium: 'AT&T Stadium', city: '阿靈頓（達拉斯）', country: '美國', capacity: 94000 },
  { id: 'mercedes', stadium: 'Mercedes-Benz Stadium', city: '阿特蘭大', country: '美國', capacity: 75000 },
  { id: 'arrowhead', stadium: 'Arrowhead Stadium', city: '堪薩斯城', country: '美國', capacity: 73000 },
  { id: 'nrg', stadium: 'NRG Stadium', city: '侯斯頓', country: '美國', capacity: 72000 },
  { id: 'levis', stadium: "Levi's Stadium", city: '聖塔克拉拉（三藩市灣區）', country: '美國', capacity: 71000 },
  { id: 'sofi', stadium: 'SoFi Stadium', city: '英格爾伍德（洛杉磯）', country: '美國', capacity: 70000 },
  { id: 'lincoln', stadium: 'Lincoln Financial Field', city: '費城', country: '美國', capacity: 69000 },
  { id: 'lumen', stadium: 'Lumen Field', city: '西雅圖', country: '美國', capacity: 69000 },
  { id: 'gillette', stadium: 'Gillette Stadium', city: '霍士堡（波士頓）', country: '美國', capacity: 65000 },
  { id: 'hardrock', stadium: 'Hard Rock Stadium', city: '邁阿密花園', country: '美國', capacity: 65000 },
  { id: 'bcplace', stadium: 'BC Place', city: '溫哥華', country: '加拿大', capacity: 54000 },
  { id: 'bbva', stadium: 'Estadio BBVA', city: '瓜達盧佩（蒙特雷）', country: '墨西哥', capacity: 53500 },
  { id: 'akron', stadium: 'Estadio Akron', city: '薩波潘（瓜達拉哈拉）', country: '墨西哥', capacity: 48000 },
  { id: 'bmo', stadium: 'BMO Field', city: '多倫多', country: '加拿大', capacity: 45000 },
];

export const venuesById: ReadonlyMap<string, Venue> = new Map(venues.map((v) => [v.id, v]));

export function getVenueById(id: string): Venue | undefined {
  return venuesById.get(id);
}
