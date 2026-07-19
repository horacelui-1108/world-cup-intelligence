# World Cup Intelligence Hub（世界盃賽事情報站）

2026 FIFA World Cup 賽事情報及賽後分析網站。提供完整賽程、Match Centre、分組排名、互動淘汰賽圖、球隊/球員頁，以及**防虛構賽後分析引擎**——所有分析只由已核實嘅比賽事件及統計生成，每個數字可追溯至來源。

系統架構以 **Tournament Config + Data Provider Adapter** 設計，日後只需新增 config 同 provider 即可切換至其他世界盃或足球賽事。

## 功能

| 頁面 | 內容 |
|---|---|
| `/` 首頁 | 今日比賽、最新賽果、下一場比賽、熱門球隊（可追蹤，localStorage 持久化）、最新賽後分析、決賽倒數、賽事重要消息、最後更新時間 |
| `/schedule` | 104 場完整賽程：日期/分組視圖、階段/組別/球隊/狀態篩選、搜尋、本地↔香港時間切換，篩選狀態全部入 URL |
| `/matches/:matchId` | Match Centre：比分 hero、事件時間軸（入球/牌/換人/VAR）、陣容、統計（xG 只喺來源提供時顯示）、VAR、資訊；tabs 經 `?tab=` 同步 |
| `/standings` | 12 組排名表（由賽果即時計算）、最佳第三名排名、同分排名規則說明、晉級/出局標記 |
| `/bracket` | 互動 32強→決賽 bracket + 季軍戰節點，click 入 Match Centre，mobile 分輪橫向 scroll |
| `/teams/:teamId` | 球隊資料、賽程賽果、球員名單、純計算統計、相關分析 |
| `/players/:playerId` | 球員統計卡、逐場紀錄、射手/助攻榜位置、相關分析 |
| `/analysis` + `/analysis/:slug` | 賽後分析列表及文章：100字摘要、完整分析、戰術、轉捩點、關鍵球員、重要換人、數據結論、下一場影響、來源清單（〔Sn〕inline 溯源 popover） |

介面：預設繁體中文（chrome 可切英文，內容英文化「即將推出」）、深色/淺色模式、mobile-first（bottom tab bar）、Loading/Error/Empty states、WCAG AA 對比度、語意化 HTML、`prefers-reduced-motion` 支援。

## 安裝及啟動

```bash
npm install
npm run dev        # 開發伺服器
npm run build      # production build → dist/
npm run preview    # 預覽 production build
```

環境：Node.js 20+。技術棧：React 19 + TypeScript + Vite 7 + Tailwind CSS 3.4 + shadcn/ui + framer-motion + GSAP + date-fns-tz。

## 環境變數

| 變數 | 用途 | 必填 |
|---|---|---|
| `VITE_FOOTBALL_API_KEY` | API-Football (API-SPORTS) v3 key。無 key 時自動進入 Demo Mode（內建已核實數據，UI 標示「示範數據」） | 否 |

見 `.env.example`。`.env*` 已加入 `.gitignore`，**切勿**將真實 key commit 入 repo。注意：`VITE_` 變數會打入 client bundle，生产環境建議喺 API-SPORTS dashboard 限制 key 或經 proxy 轉發。

## 資料架構

```
UI 組件 → getProvider() ──┬── ApiFootballProvider（有 key：TTL cache + retry + rate-limit 處理 + 失敗 fallback）
                          └── DemoProvider（無 key：內建已核實 snapshot，dataMode='demo'）
```

每筆資料帶 `SourceMeta`：`source / sourceUrl / retrievedAt / lastUpdated / dataStatus (LIVE|FINAL|VERIFIED|PENDING|DEMO|STALE)`。

## Database Schema（資料模型，見 `src/types/football.ts`）

實體：`Tournament`、`Team(id, code3, nameZh, nameEn, group, flagColors)`、`Venue(id, stadium, city, country, capacity)`、`Match(matchId, stage, group, kickoffUtc, venueId, homeTeamId, awayTeamId, status, score{home,away,halfTime,extraTime,penalties}, events[], stats, source)`、`MatchEvent(minute, type[goal|pen_goal|pen_miss|own_goal|yellow|second_yellow|red|sub|var], playerName, assistName, varOutcome)`、`MatchStats(possession, shots, shotsOnTarget, corners, fouls, offsides, passAccuracy, xg — 全 optional)`、`Player(id, nameZh, nameEn, teamId, number, position)`、`PlayerStats(goals, assists, yellow, red — 全 optional，undefined ≠ 0)`、`NewsItem`、`MatchAnalysis`（見 `src/lib/analysis/types.ts`）。

目前以 TypeScript 模組做 read-only store（build-time bundled）；接駁真實 API 後同一 schema 可映射落任何 DB（建議表：`tournaments, teams, venues, matches, match_events, match_stats, players, player_stats, analyses, sources`）。

## API 清單（Provider interface，見 `src/lib/provider/types.ts`）

`getTournament()`、`getMatches(filter?)`、`getMatch(id)`、`getStandings()`、`getBracket()`、`getTeam(id)`、`getPlayersByTeam(id)`、`getPlayer(id)`、`getTopScorers()`、`getNews()`、`getAnalysis(matchId)`、`listAnalyses()`；capability flags：`{ hasXG, hasRatings, hasFormations, live }`。

真實 API 映射（API-Football v3）：`GET /fixtures?league=1&season=2026`、`/fixtures/events`、`/fixtures/statistics`、`/fixtures/lineups`、`/standings?league=1&season=2026`。Cache：賽後數據 TTL 24h、live 60s；exponential backoff ×3；失敗自動 fallback DemoProvider 並標 `STALE`。

## 賽後分析引擎（`src/lib/analysis/`）

規則式生成：FT 先觸發；數據完整度分級 T0–T3 決定可出章節；mapping rules M0–M5（高控球落敗、xG 差距、紅牌轉捩點、換人見效、射門壓倒、缺數據 fallback）；發布前 G-11 三步驗證——①數字審計（文本每個數字對返輸入數據）②禁止語句掃描（估算詞/意圖斷言/氣氛虛構/過強因果/無條件預測等）③來源覆蓋檢查。失敗 → `blocked` 唔發布。框架全文見 `/mnt/agents/output/analysis-framework.md`。

## Demo Data 清單

無 API key 時以下為內建數據（UI 顯示「示範數據」badge）：
- **VERIFIED（真實已核實，來源 ESPN/FIFA，retrieved 2026-07-19）**：全部 104 場賽程及 103 場賽果、12 組分組名單、16 球場、淘汰賽入球者（brief 有嘅）、VAR 事件（M92/M95/M99）、射手榜前 5、7 條賽事消息。
- **誠實留空**：小組賽入球者、陣容、技術統計、xG、領隊、FIFA 排名——一律顯示「資料不足」，唔會虛構。
- 小組賽開球時間為近似值（`src/data/matches.ts` 頭部註明）；日期全部準確。

## 測試結果

- **QA**：11 條路由直接開（SPA refresh）全過、0 console error；篩選/時區/theme/lang/tabs/bracket/standings/popover/pagination/favorites 全過；mobile 375px 無爆版；假按鈕掃描通過（修復後）。
- **Data Validation**：104 場對照權威來源全對（修復 M87/M100 加時、M100 VAR、M99 分鐘後）；12 組排名 + 最佳第三名手算驗算一致；bracket winner 推導全對；分析引擎 15 場 + 邊界測試通過 G-01/G-13/sourceRefs 審計（4,286 checks）。
- **Security**：0 vulnerabilities（npm audit fix 後）；無 hardcoded key；XSS 面乾淨；production build 無 code-path 洩漏；`.env*` 已 gitignore。
- **Build**：`npm run build` + `tsc --noEmit` 通過；dist gzip ~328 kB JS + 18 kB CSS。

## 已知限制

1. 無 API key → Demo Mode；決賽（M104）結果未包含（數據截於 2026-07-19 開賽前，`PENDING`）。
2. 陣容、技術統計、xG、領隊等欄位 demo 數據未涵蓋 → 顯示「資料不足」（設計如此，拒絕虛構）。
3. 英文切換只覆蓋 UI chrome，內容英文化排期中。
4. Bundle ~1 MB（未做 route-level code splitting，已列入 roadmap）。
5. 部分入球分鐘未核實以 `--'` 顯示；R32 具體 slot 配對以賽果推導，未逐格對照官方 bracket 文件。
6. 48 隊徽為簡化幾何版國旗配色（非官方會徽，避免版權問題）。

## Sub-agent 分工紀錄

| Agent | 交付 |
|---|---|
| Data Research | 資料來源/API 研究、2026 WC 全部真實賽果收集（雙源核實） |
| Football Analysis | 賽後分析生成框架（防虛構 guardrails、mapping rules、data model） |
| UX/UI | 資訊架構、design tokens、component inventory、a11y checklist |
| Pro_Designer | 全域 + 9 頁設計文件 |
| Scaffold | 共享基建（Navbar/Footer/Layout/12 共享組件/theme/timezone/lang contexts）+ 首頁 + 媒體資產 |
| Data Layer | 領域類型、104 場數據集、Provider Adapter、排名推導、分析引擎、48 隊徽 SVG |
| Page ×5 | 賽程+Match Centre / 排名+Bracket / 球隊+球員 / 分析頁 / 首頁接駁 |
| QA / Data Validation / Security Review | 功能測試、數據核對、安全審查 |
| Fix | 15 項修復（數據修正、BUG-1/2/3、安全加固） |

## 開發過程遇到嘅問題及解決

1. **環境冇 image generation 工具** → hero/stadium 用 duotone 處理嘅圖片 + PIL 程序化生成 texture/og-cover；48 隊徽改為程式化 SVG。
2. **Sandbox worktree 被 prune/清理** → worktree metadata 手工重建，branch 無損失；master merge 遇 I/O error → reset + clean 後重試成功。
3. **Scaffold 首頁曾用 local mock** → 獨立 home-integration agent 全面接駁 provider；審計確認無虛構殘留。
4. **設計 token 同 Tailwind opacity modifier 衝突**（hex var 配 `/opacity` 唔生成 CSS）→ 改 solid 或 color-mix。
5. **加時賽分鐘顯示**（93' 誤顯 90+3'）→ `formatMinute` 加 `aet` 參數按 `score.extraTime` 切換。

## 免責聲明

本站為非官方賽事情報網站，所有數據僅供參考，與 FIFA 無隸屬關係。賽果數據核對自 ESPN/FIFA.com 公開報導。
