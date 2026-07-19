/**
 * 48 支參賽球隊 — 2026 FIFA 世界盃
 * 分組依 data-research-brief.md（VERIFIED）。
 * flagColors 按真實國旗配色（2–3 hex），供 crest SVG 使用。
 * FIFA 排名無核實來源，rank 一律唔填。
 */
import type { Team } from '../types/football';

export const teams: Team[] = [
  // A 組
  { id: 'mex', code3: 'MEX', nameZh: '墨西哥', nameEn: 'Mexico', group: 'A', flagColors: ['#006847', '#FFFFFF', '#CE1126'] },
  { id: 'rsa', code3: 'RSA', nameZh: '南非', nameEn: 'South Africa', group: 'A', flagColors: ['#007A4D', '#FFB612', '#000000'] },
  { id: 'kor', code3: 'KOR', nameZh: '南韓', nameEn: 'South Korea', group: 'A', flagColors: ['#FFFFFF', '#CD2E3A', '#0047A0'] },
  { id: 'cze', code3: 'CZE', nameZh: '捷克', nameEn: 'Czechia', group: 'A', flagColors: ['#FFFFFF', '#D7141A', '#11457E'] },
  // B 組
  { id: 'can', code3: 'CAN', nameZh: '加拿大', nameEn: 'Canada', group: 'B', flagColors: ['#FF0000', '#FFFFFF'] },
  { id: 'bih', code3: 'BIH', nameZh: '波斯尼亞', nameEn: 'Bosnia and Herzegovina', group: 'B', flagColors: ['#002395', '#FECB00', '#FFFFFF'] },
  { id: 'qat', code3: 'QAT', nameZh: '卡塔爾', nameEn: 'Qatar', group: 'B', flagColors: ['#8A1538', '#FFFFFF'] },
  { id: 'sui', code3: 'SUI', nameZh: '瑞士', nameEn: 'Switzerland', group: 'B', flagColors: ['#DA291C', '#FFFFFF'] },
  // C 組
  { id: 'bra', code3: 'BRA', nameZh: '巴西', nameEn: 'Brazil', group: 'C', flagColors: ['#009C3B', '#FFDF00', '#002776'] },
  { id: 'mar', code3: 'MAR', nameZh: '摩洛哥', nameEn: 'Morocco', group: 'C', flagColors: ['#C1272D', '#006233'] },
  { id: 'hai', code3: 'HAI', nameZh: '海地', nameEn: 'Haiti', group: 'C', flagColors: ['#00209F', '#D21034', '#FFFFFF'] },
  { id: 'sco', code3: 'SCO', nameZh: '蘇格蘭', nameEn: 'Scotland', group: 'C', flagColors: ['#005EB8', '#FFFFFF'] },
  // D 組
  { id: 'usa', code3: 'USA', nameZh: '美國', nameEn: 'United States', group: 'D', flagColors: ['#B22234', '#FFFFFF', '#3C3B6E'] },
  { id: 'par', code3: 'PAR', nameZh: '巴拉圭', nameEn: 'Paraguay', group: 'D', flagColors: ['#D52B1E', '#FFFFFF', '#0038A8'] },
  { id: 'aus', code3: 'AUS', nameZh: '澳洲', nameEn: 'Australia', group: 'D', flagColors: ['#00247D', '#FFFFFF', '#FF0000'] },
  { id: 'tur', code3: 'TUR', nameZh: '土耳其', nameEn: 'Türkiye', group: 'D', flagColors: ['#E30A17', '#FFFFFF'] },
  // E 組
  { id: 'ger', code3: 'GER', nameZh: '德國', nameEn: 'Germany', group: 'E', flagColors: ['#000000', '#DD0000', '#FFCC00'] },
  { id: 'cuw', code3: 'CUW', nameZh: '庫拉索', nameEn: 'Curaçao', group: 'E', flagColors: ['#002B7F', '#F9E814', '#FFFFFF'] },
  { id: 'civ', code3: 'CIV', nameZh: '科特迪瓦', nameEn: 'Ivory Coast', group: 'E', flagColors: ['#F77F00', '#FFFFFF', '#009E60'] },
  { id: 'ecu', code3: 'ECU', nameZh: '厄瓜多爾', nameEn: 'Ecuador', group: 'E', flagColors: ['#FFDD00', '#034EA2', '#ED1C24'] },
  // F 組
  { id: 'ned', code3: 'NED', nameZh: '荷蘭', nameEn: 'Netherlands', group: 'F', flagColors: ['#AE1C28', '#FFFFFF', '#21468B'] },
  { id: 'jpn', code3: 'JPN', nameZh: '日本', nameEn: 'Japan', group: 'F', flagColors: ['#FFFFFF', '#BC002D'] },
  { id: 'swe', code3: 'SWE', nameZh: '瑞典', nameEn: 'Sweden', group: 'F', flagColors: ['#006AA7', '#FECC02'] },
  { id: 'tun', code3: 'TUN', nameZh: '突尼西亞', nameEn: 'Tunisia', group: 'F', flagColors: ['#E70013', '#FFFFFF'] },
  // G 組
  { id: 'bel', code3: 'BEL', nameZh: '比利時', nameEn: 'Belgium', group: 'G', flagColors: ['#000000', '#FEDD00', '#EF3340'] },
  { id: 'egy', code3: 'EGY', nameZh: '埃及', nameEn: 'Egypt', group: 'G', flagColors: ['#CE1126', '#FFFFFF', '#000000'] },
  { id: 'irn', code3: 'IRN', nameZh: '伊朗', nameEn: 'Iran', group: 'G', flagColors: ['#239F40', '#FFFFFF', '#DA0000'] },
  { id: 'nzl', code3: 'NZL', nameZh: '紐西蘭', nameEn: 'New Zealand', group: 'G', flagColors: ['#00247D', '#CC142B', '#FFFFFF'] },
  // H 組
  { id: 'esp', code3: 'ESP', nameZh: '西班牙', nameEn: 'Spain', group: 'H', flagColors: ['#AA151B', '#F1BF00'] },
  { id: 'cpv', code3: 'CPV', nameZh: '佛得角', nameEn: 'Cabo Verde', group: 'H', flagColors: ['#003893', '#FFFFFF', '#CF2027'] },
  { id: 'ksa', code3: 'KSA', nameZh: '沙特阿拉伯', nameEn: 'Saudi Arabia', group: 'H', flagColors: ['#006C35', '#FFFFFF'] },
  { id: 'uru', code3: 'URU', nameZh: '烏拉圭', nameEn: 'Uruguay', group: 'H', flagColors: ['#FFFFFF', '#0038A8', '#FCD116'] },
  // I 組
  { id: 'fra', code3: 'FRA', nameZh: '法國', nameEn: 'France', group: 'I', flagColors: ['#0055A4', '#FFFFFF', '#EF4135'] },
  { id: 'sen', code3: 'SEN', nameZh: '塞內加爾', nameEn: 'Senegal', group: 'I', flagColors: ['#00853F', '#FDEF42', '#E31B23'] },
  { id: 'irq', code3: 'IRQ', nameZh: '伊拉克', nameEn: 'Iraq', group: 'I', flagColors: ['#CE1126', '#FFFFFF', '#000000'] },
  { id: 'nor', code3: 'NOR', nameZh: '挪威', nameEn: 'Norway', group: 'I', flagColors: ['#BA0C2F', '#FFFFFF', '#00205B'] },
  // J 組
  { id: 'arg', code3: 'ARG', nameZh: '阿根廷', nameEn: 'Argentina', group: 'J', flagColors: ['#75AADB', '#FFFFFF', '#F6B40E'] },
  { id: 'alg', code3: 'ALG', nameZh: '阿爾及利亞', nameEn: 'Algeria', group: 'J', flagColors: ['#006233', '#FFFFFF', '#D21034'] },
  { id: 'aut', code3: 'AUT', nameZh: '奧地利', nameEn: 'Austria', group: 'J', flagColors: ['#EF3340', '#FFFFFF'] },
  { id: 'jor', code3: 'JOR', nameZh: '約旦', nameEn: 'Jordan', group: 'J', flagColors: ['#000000', '#FFFFFF', '#007A3D'] },
  // K 組
  { id: 'por', code3: 'POR', nameZh: '葡萄牙', nameEn: 'Portugal', group: 'K', flagColors: ['#046A38', '#DA291C', '#FFE900'] },
  { id: 'cod', code3: 'COD', nameZh: '剛果民主共和國', nameEn: 'DR Congo', group: 'K', flagColors: ['#007FFF', '#F7D618', '#CE1021'] },
  { id: 'uzb', code3: 'UZB', nameZh: '烏茲別克斯坦', nameEn: 'Uzbekistan', group: 'K', flagColors: ['#0099B5', '#FFFFFF', '#1EB53A'] },
  { id: 'col', code3: 'COL', nameZh: '哥倫比亞', nameEn: 'Colombia', group: 'K', flagColors: ['#FCD116', '#003893', '#CE1126'] },
  // L 組
  { id: 'eng', code3: 'ENG', nameZh: '英格蘭', nameEn: 'England', group: 'L', flagColors: ['#FFFFFF', '#CE1124'] },
  { id: 'cro', code3: 'CRO', nameZh: '克羅地亞', nameEn: 'Croatia', group: 'L', flagColors: ['#FF0000', '#FFFFFF', '#171796'] },
  { id: 'gha', code3: 'GHA', nameZh: '加納', nameEn: 'Ghana', group: 'L', flagColors: ['#CE1126', '#FCD116', '#006B3F'] },
  { id: 'pan', code3: 'PAN', nameZh: '巴拿馬', nameEn: 'Panama', group: 'L', flagColors: ['#FFFFFF', '#D21034', '#005293'] },
];

export const teamsById: ReadonlyMap<string, Team> = new Map(teams.map((t) => [t.id, t]));

export function getTeamById(id: string): Team | undefined {
  return teamsById.get(id);
}
