/**
 * 關鍵球員名單（80 人）— 2026 FIFA 世界盃（決賽後最終版）
 *
 * 數據誠信聲明：
 * - 只填確定資料：姓名、國家隊、位置（大致分類）。號碼、年齡、球會無核實來源，一律 undefined。
 * - PlayerStats 只填 brief 有嘅數字：
 *   射手榜（最終，含助攻）：Mbappé 10 + 4 助攻、Messi 8 + 4 助攻、Bellingham 7 + 1 助攻、
 *   Haaland 7、Dembélé 6 + 2 助攻、Kane 6 + 2 助攻、Oyarzabal 5 + 1 助攻、Sarr 4 + 1 助攻、
 *   Quiñones 4 + 1 助攻、Vinícius Júnior 4 + 1 助攻、Saka 3（季軍戰帽子戲法）、Ferran Torres 1；
 *   Embolo 紅牌 1（M100）、Enzo Fernández 紅牌 1（M104 兩黃一紅）。
 *   其餘球員嘅單場入球記錄喺 matches.ts events/scorers，tournament 總數未核實，故此唔填，避免虛構。
 */
import type { Player } from '../types/football';

export const players: Player[] = [
  // --- 射手榜前列 ---
  { id: 'mbappe', nameZh: '麥巴比', nameEn: 'Kylian Mbappé', teamId: 'fra', position: 'FW', stats: { goals: 10, assists: 4 } },
  { id: 'messi', nameZh: '美斯', nameEn: 'Lionel Messi', teamId: 'arg', position: 'FW', stats: { goals: 8, assists: 4 } },
  { id: 'haaland', nameZh: '夏蘭特', nameEn: 'Erling Haaland', teamId: 'nor', position: 'FW', stats: { goals: 7 } },
  { id: 'kane', nameZh: '哈利·簡尼', nameEn: 'Harry Kane', teamId: 'eng', position: 'FW', stats: { goals: 6, assists: 2 } },
  { id: 'bellingham', nameZh: '比寧咸', nameEn: 'Jude Bellingham', teamId: 'eng', position: 'MF', stats: { goals: 7, assists: 1 } },

  // --- 西班牙（冠軍）---
  { id: 'unai-simon', nameZh: '烏尼·施蒙', nameEn: 'Unai Simón', teamId: 'esp', position: 'GK' },
  { id: 'carvajal', nameZh: '卡華積', nameEn: 'Dani Carvajal', teamId: 'esp', position: 'DF' },
  { id: 'laporte', nameZh: '拿樸迪', nameEn: 'Aymeric Laporte', teamId: 'esp', position: 'DF' },
  { id: 'rodri', nameZh: '洛迪', nameEn: 'Rodri', teamId: 'esp', position: 'MF' },
  { id: 'pedri', nameZh: '柏迪', nameEn: 'Pedri', teamId: 'esp', position: 'MF' },
  { id: 'merino', nameZh: '米基·馬連奴', nameEn: 'Mikel Merino', teamId: 'esp', position: 'MF' },
  { id: 'porro', nameZh: '柏度·樸路', nameEn: 'Pedro Porro', teamId: 'esp', position: 'DF' },
  { id: 'oyarzabal', nameZh: '奧耶沙巴', nameEn: 'Mikel Oyarzabal', teamId: 'esp', position: 'FW', stats: { goals: 5, assists: 1 } },
  { id: 'lamine-yamal', nameZh: '拉明·耶馬', nameEn: 'Lamine Yamal', teamId: 'esp', position: 'FW' },
  // 決賽正選/後備新增
  { id: 'cubarsi', nameZh: '柏奧·古巴斯', nameEn: 'Pau Cubarsí', teamId: 'esp', position: 'DF' },
  { id: 'cucurella', nameZh: '馬克·古古列拿', nameEn: 'Marc Cucurella', teamId: 'esp', position: 'DF' },
  { id: 'fabian-ruiz', nameZh: '法比安·雷斯', nameEn: 'Fabián Ruiz', teamId: 'esp', position: 'MF' },
  { id: 'dani-olmo', nameZh: '丹尼·奧莫', nameEn: 'Dani Olmo', teamId: 'esp', position: 'MF' },
  { id: 'alex-baena', nameZh: '阿歷斯·巴爾拿', nameEn: 'Álex Baena', teamId: 'esp', position: 'MF' },
  { id: 'torres', nameZh: '費蘭·托利斯', nameEn: 'Ferran Torres', teamId: 'esp', position: 'FW', stats: { goals: 1 } },
  { id: 'nico-williams', nameZh: '歷高·威廉斯', nameEn: 'Nico Williams', teamId: 'esp', position: 'FW' },
  { id: 'zubimendi', nameZh: '馬田·蘇比文迪', nameEn: 'Martín Zubimendi', teamId: 'esp', position: 'MF' },
  { id: 'eric-garcia', nameZh: '艾利·加西亞', nameEn: 'Eric García', teamId: 'esp', position: 'DF' },

  // --- 阿根廷（決賽隊伍）---
  { id: 'e-martinez', nameZh: '艾米利安奴·馬天尼斯', nameEn: 'Emiliano Martínez', teamId: 'arg', position: 'GK' },
  { id: 'romero', nameZh: '基斯甸·羅美路', nameEn: 'Cristian Romero', teamId: 'arg', position: 'DF' },
  { id: 'otamendi', nameZh: '奧達文迪', nameEn: 'Nicolás Otamendi', teamId: 'arg', position: 'DF' },
  { id: 'tagliafico', nameZh: '達基亞費高', nameEn: 'Nicolás Tagliafico', teamId: 'arg', position: 'DF' },
  { id: 'de-paul', nameZh: '迪保羅', nameEn: 'Rodrigo De Paul', teamId: 'arg', position: 'MF' },
  { id: 'e-fernandez', nameZh: '安素·費南迪斯', nameEn: 'Enzo Fernández', teamId: 'arg', position: 'MF', stats: { red: 1 } },
  { id: 'mac-allister', nameZh: '麥亞里士打', nameEn: 'Alexis Mac Allister', teamId: 'arg', position: 'MF' },
  { id: 'alvarez', nameZh: '祖利安·艾華利斯', nameEn: 'Julián Álvarez', teamId: 'arg', position: 'FW' },
  { id: 'l-martinez', nameZh: '拿達路·馬天尼斯', nameEn: 'Lautaro Martínez', teamId: 'arg', position: 'FW' },
  // 決賽正選/後備新增
  { id: 'montiel', nameZh: '干沙路·蒙迪亞', nameEn: 'Gonzalo Montiel', teamId: 'arg', position: 'DF' },
  { id: 'lisandro-martinez', nameZh: '利辛度·馬天尼斯', nameEn: 'Lisandro Martínez', teamId: 'arg', position: 'DF' },
  { id: 'nico-gonzalez', nameZh: '歷高·干沙利斯', nameEn: 'Nico González', teamId: 'arg', position: 'MF' },
  { id: 'paredes', nameZh: '利安度·柏利迪斯', nameEn: 'Leandro Paredes', teamId: 'arg', position: 'MF' },
  { id: 'molina', nameZh: '拿維·摩連拿', nameEn: 'Nahuel Molina', teamId: 'arg', position: 'DF' },
  { id: 'medina', nameZh: '法根度·麥甸拿', nameEn: 'Facundo Medina', teamId: 'arg', position: 'DF' },
  { id: 'g-simeone', nameZh: '基奧利安奴·施蒙尼', nameEn: 'Giuliano Simeone', teamId: 'arg', position: 'FW' },
  { id: 'senesi', nameZh: '馬高斯·辛尼斯', nameEn: 'Marcos Senesi', teamId: 'arg', position: 'DF' },

  // --- 法國（四強）---
  { id: 'maignan', nameZh: '麥尼安', nameEn: 'Mike Maignan', teamId: 'fra', position: 'GK' },
  { id: 'kounde', nameZh: '高迪', nameEn: 'Jules Koundé', teamId: 'fra', position: 'DF' },
  { id: 'saliba', nameZh: '沙列巴', nameEn: 'William Saliba', teamId: 'fra', position: 'DF' },
  { id: 'upamecano', nameZh: '烏柏美卡奴', nameEn: 'Dayot Upamecano', teamId: 'fra', position: 'DF' },
  { id: 'tchouameni', nameZh: '祖亞曼尼', nameEn: 'Aurélien Tchouaméni', teamId: 'fra', position: 'MF' },
  { id: 'rabiot', nameZh: '拉比奧特', nameEn: 'Adrien Rabiot', teamId: 'fra', position: 'MF' },
  { id: 'dembele', nameZh: '奧士文·迪比利', nameEn: 'Ousmane Dembélé', teamId: 'fra', position: 'FW', stats: { goals: 6, assists: 2 } },
  { id: 'barcola', nameZh: '巴高拿', nameEn: 'Bradley Barcola', teamId: 'fra', position: 'FW' },

  // --- 英格蘭（四強）---
  { id: 'pickford', nameZh: '碧福特', nameEn: 'Jordan Pickford', teamId: 'eng', position: 'GK' },
  { id: 'stones', nameZh: '史東斯', nameEn: 'John Stones', teamId: 'eng', position: 'DF' },
  { id: 'guehi', nameZh: '古希', nameEn: 'Marc Guéhi', teamId: 'eng', position: 'DF' },
  { id: 'rice', nameZh: '迪勤·懷斯', nameEn: 'Declan Rice', teamId: 'eng', position: 'MF' },
  { id: 'saka', nameZh: '布卡約·沙卡', nameEn: 'Bukayo Saka', teamId: 'eng', position: 'FW', stats: { goals: 3 } },
  { id: 'gordon', nameZh: '安東尼·哥頓', nameEn: 'Anthony Gordon', teamId: 'eng', position: 'FW' },
  { id: 'konsa', nameZh: '艾斯利·干沙', nameEn: 'Ezri Konsa', teamId: 'eng', position: 'DF' },

  // --- 挪威（八強，射手榜 Haaland）---
  { id: 'nusa', nameZh: '安東尼奧·努沙', nameEn: 'Antonio Nusa', teamId: 'nor', position: 'FW' },
  { id: 'schjelderup', nameZh: '安達斯·舒爾迪立', nameEn: 'Andreas Schjelderup', teamId: 'nor', position: 'FW' },
  { id: 'odegaard', nameZh: '奧迪加特', nameEn: 'Martin Ødegaard', teamId: 'nor', position: 'MF' },
  { id: 'heggem', nameZh: '希瑾', nameEn: 'Heggem', teamId: 'nor', position: 'DF' },

  // --- 淘汰賽 brief 提及嘅入球者 ---
  { id: 'eustaquio', nameZh: '史堤芬·尤斯塔基奧', nameEn: 'Stephen Eustáquio', teamId: 'can', position: 'MF' },
  { id: 'sano', nameZh: '沙努', nameEn: 'Sano', teamId: 'jpn', position: 'MF' },
  { id: 'casemiro', nameZh: '卡斯米路', nameEn: 'Casemiro', teamId: 'bra', position: 'MF' },
  { id: 'martinelli', nameZh: '加比爾·馬天尼利', nameEn: 'Gabriel Martinelli', teamId: 'bra', position: 'FW' },
  { id: 'enciso', nameZh: '胡利奧·恩斯素', nameEn: 'Julio Enciso', teamId: 'par', position: 'FW' },
  { id: 'havertz', nameZh: '卡伊·夏維斯', nameEn: 'Kai Havertz', teamId: 'ger', position: 'FW' },
  { id: 'gakpo', nameZh: '高迪·加普', nameEn: 'Cody Gakpo', teamId: 'ned', position: 'FW' },
  { id: 'diop', nameZh: '迪奧普', nameEn: 'Diop', teamId: 'mar', position: 'FW' },
  { id: 'diallo', nameZh: '迪亞路', nameEn: 'Diallo', teamId: 'civ', position: 'FW' },
  { id: 'quinones', nameZh: '昆奴尼斯', nameEn: 'Quiñones', teamId: 'mex', position: 'FW', stats: { goals: 4, assists: 1 } },
  { id: 'jimenez', nameZh: '占美尼斯', nameEn: 'Jiménez', teamId: 'mex', position: 'FW' },
  { id: 'cipenga', nameZh: '施賓加', nameEn: 'Cipenga', teamId: 'cod', position: 'FW' },
  { id: 'lukaku', nameZh: '羅美路·盧卡古', nameEn: 'Romelu Lukaku', teamId: 'bel', position: 'FW' },
  { id: 'tielemans', nameZh: '約理·迪利文斯', nameEn: 'Youri Tielemans', teamId: 'bel', position: 'MF' },
  { id: 'balogun', nameZh: '科拉連·巴洛根', nameEn: 'Folarin Balogun', teamId: 'usa', position: 'FW' },
  { id: 'tillman', nameZh: '馬歷·迪爾文', nameEn: 'Malik Tillman', teamId: 'usa', position: 'MF' },
  { id: 'diarra', nameZh: '迪亞拉', nameEn: 'Diarra', teamId: 'sen', position: 'MF' },
  { id: 'sarr', nameZh: '沙亞', nameEn: 'Sarr', teamId: 'sen', position: 'FW', stats: { goals: 4, assists: 1 } },
  { id: 'ndoye', nameZh: '丹·恩杜耶', nameEn: 'Dan Ndoye', teamId: 'sui', position: 'FW' },
  { id: 'embolo', nameZh: '比列·安保路', nameEn: 'Breel Embolo', teamId: 'sui', position: 'FW', stats: { red: 1 } },
  { id: 'vinicius', nameZh: '雲尼斯奧斯·祖利亞', nameEn: 'Vinícius Júnior', teamId: 'bra', position: 'FW', stats: { goals: 4, assists: 1 } },
];

export const playersById: ReadonlyMap<string, Player> = new Map(players.map((p) => [p.id, p]));

export function getPlayerById(id: string): Player | undefined {
  return playersById.get(id);
}

export function getPlayersByTeam(teamId: string): Player[] {
  return players.filter((p) => p.teamId === teamId);
}
