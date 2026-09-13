# 框架升级计划 / Framework Upgrade Plan

> 状态：**已执行（2026-09-13，方案 B，`v6` 分支）**——以 AstroPaper v6.1.0 为基座重建，已迁移 5 篇已发布文章与 about 页、KaTeX、配色、立即发布逻辑、Activities 改名；构建通过（astro check 0 错误，24 页面）。
> 检查日期：2026-09-11
> 检查方式：静态配置审查（未安装依赖、未启动 dev server、未构建、未部署）
> 仓库：`hnasgravity/hnasgravity.github.io`（AstroPaper v4.2.0 派生）

---

## 0. 结论速览

- 本仓库是 **AstroPaper v4.2.0** 的派生站点，依赖定格在 **2024-01/02**，落后上游约 **2.5 年**。
- 上游现为 **AstroPaper v6.1.0**，基于 **Astro 6 + Tailwind CSS 4 + TypeScript 6**。
- 站点当前可正常构建部署，但有若干「未来会炸」的点：CI 未跑类型检查、构建不可复现、双 lockfile 漂移、以及一批已被 Astro 6 移除的 API 调用。
- **推荐路线**：不以原地逐级升级（4→5→6）为主，而是**以 AstroPaper v6.1.0 为基座重建、把内容与少量自定义搬过去**。理由见 §4。
- **前置建议**：先把 §5「阶段 0」的零风险工程卫生改动做掉，它们与框架版本无关，单独就能提升可靠性。

---

## 1. 当前配置体检

### 1.1 依赖版本对照

`package.json` 声明 vs `package-lock.json`（lockfileVersion 3）实际解析结果：

| 包 | package.json | lockfile 实际 | 生态当前 | 备注 |
| --- | --- | --- | --- | --- |
| `astro` | `^4.2.1` | 4.2.1 | 6.1.x | Astro 6.0 发布于 2026-03 |
| `tailwindcss` | `^3.4.1` | 3.4.1 | 4.x | `@astrojs/tailwind` 已被上游弃用，改用 `@tailwindcss/vite` |
| `@astrojs/tailwind` | `^5.1.0` | 5.1.0 | 已弃用 | 见上 |
| `@astrojs/react` | `^3.0.9` | 3.0.9 | 4.x/5.x | 与 React 19 配套 |
| `react` / `react-dom` | `^18.2.0` | 18.2.0 | 19.x | 仅用于 satori OG 图模板 |
| `@astrojs/check` | `^0.5.6` | **0.4.1** | 0.9.x | ⚠️ 声明与实际不一致 |
| `@astrojs/sitemap` | `^3.0.5` | 3.0.5 | 3.x+ | |
| `typescript` | `^5.3.3` | 5.3.3 | 5.9 / 6 | 放在 `dependencies` 里，宜移到 `devDependencies` |
| `eslint` | `^8.56.0` | 8.56.0 | 9.x | 需迁 flat config |
| `eslint-plugin-astro` | `^0.31.3` | 0.31.3 | 1.x | |
| `husky` | `^8.0.3` | 8.0.3 | 9.x | `husky install` → `husky` |
| `lint-staged` | `^15.2.0` | 15.2.0 | 16.x | |
| `prettier` | `^3.2.4` | 3.2.4 | 3.x | |
| `satori` | `^0.10.11` | 0.10.11 | 0.1x | OG 图生成 |
| `@resvg/resvg-js` | `^2.6.0` | 2.6.0 | 2.x | |
| `@divriots/jampack` | `^0.23.2` | 0.23.2 | 更新缓慢 | 见 §5 阶段 0 第 6 条 |
| `fuse.js` | `^7.0.0` | 7.0.0 | 7.x | 站内搜索 |

> 说明：以上「生态当前」列为 2026-09 时点的大版本判断，实施升级时请以 `npm-check-updates` / `npm view <pkg> version` 的实际输出为准。

### 1.2 工程卫生问题（与框架版本无关，但现在就在生效）

1. **CI 绕过构建脚本**
   `.github/workflows/astro.yml` 直接执行 `bun astro build --site ... --base ...`，
   而 `package.json:7` 的构建脚本是 `"build": "astro check && astro build && jampack ./dist"`。
   结果：**`astro check`（类型检查）与 `jampack`（产物优化）从未在 CI 运行过**，CI 实际只保证「能编译就发」。

2. **构建不可复现**
   同一 workflow 使用 `oven-sh/setup-bun@v2` + `bun-version: latest`，且 `bun install` 未加 `--frozen-lockfile`。
   上游任一新版发布都可能直接改变线上产物。

3. **双 lockfile 漂移**
   - `bun.lockb`：二进制格式，mtime 2024-03-20
   - `package-lock.json`：lockfileVersion 3，mtime 2024-02-19
   - CI 使用 bun；本地已装 bun 1.4.2，而 bun ≥1.2 读写的是**文本 `bun.lock`**，与现有 `bun.lockb` 不是同一代。
   - 风险：`bun install` 会自动迁移 lockfile，产生额外 churn；两份锁文件解析结果可能不同。

4. **缺少版本与自动化约束**
   无 `engines` 字段、无 `packageManager` 字段、无 `.nvmrc`；
   无 Dependabot / Renovate；无 lint 作业、无 `npm audit` / 安全审计作业。

5. **lint 实际未生效**
   `.husky/pre-commit` 执行 `npx lint-staged`，但 `package.json:88` 的 `lint-staged` 只配置了 `prettier --write`。
   `package.json:17` 的 `"lint": "eslint ."` 没有任何自动触发点。

6. **死配置 / 过时配置**
   - `.npmrc` 中 `shamefully-hoist=true` 是给 pnpm 的，本项目用 bun/npm，无作用。
   - `.eslintignore` 在 ESLint 9 中已被移除（改用 `ignores`）。
   - `.vscode/launch.json` 指向 `./node_modules/.bin/astro dev`，本地路径假设。
   - 多处 `.DS_Store`（已被 `.gitignore` 忽略，仅需清理工作区）。

7. **Actions 版本偏旧**
   `actions/checkout@v4`、`actions/configure-pages@v4`（现已有 v5/v6）、`upload-pages-artifact@v3`、`deploy-pages@v4`。

8. **部署触发**
   workflow 含 `schedule: cron '5 18 * * *'`（每日重建一次）+ `push: main` + 手动 dispatch。定时重建对纯静态站点无必要，可评估移除（若未来改用 scheduled posts 的构建期过滤，则需保留）。

---

## 2. 升级前必须处理的代码点

以下位置在 Astro 5 / 6 中属于 breaking change 或已移除，**任何升级路径都要改**：

| # | 位置 | 现状 | 目标 |
| --- | --- | --- | --- |
| 1 | `src/content/config.ts:4` | `defineCollection({ type: "content", ... })`（legacy Content Collections） | 移到 `src/content.config.ts`，改用 Content Layer + `glob()` loader（Astro 6 已移除 legacy API） |
| 2 | `src/layouts/PostDetails.astro:29` | `const { Content } = await post.render();` | `import { render } from "astro:content"` → `const { Content } = await render(post);` |
| 3 | `src/pages/posts/[slug]/index.astro:17` | `params: { slug: post.slug }` | 用 `post.id`（`entry.slug` 在 v5 起废弃） |
| 4 | `src/layouts/Layout.astro:4,114` | `import { ViewTransitions } from "astro:transitions"` + `<ViewTransitions />` | `<ClientRouter />` |
| 5 | `src/content/config.ts:1` | `import { defineCollection, z } from "astro:content"` | `z` 改为从 `astro/zod`（或新版 `astro:schema`）导入 |
| 6 | `tailwind.config.cjs:1-7` | `withOpacity()` 包装 `rgb(var(--color-*))` 三通道变量 | **Tailwind 4 无法沿用**：改 CSS-first `@theme`，透明度用 `--alpha()` / `color-mix()` 处理 |
| 7 | `src/styles/base.css:1-3` | `@tailwind base; @tailwind components; @tailwind utilities;` | Tailwind 4：`@import "tailwindcss";` + `@theme` / `@utility` |
| 8 | `src/layouts/PostDetails.astro:57` | `post.data.ogImage` 的 `.src` 用法 | 内容层化后 `ImageMetadata` 字段需重新验证 |

### 2.1 ⚠️ URL 陷阱（最容易静默出错）

`src/content/config.ts:5-19` 的 zod schema 是**非 strict** 的 `z.object`，因此 frontmatter 里的 `slug` 字段会被 strip 出 `data`；
但 Astro 4 的 legacy collection 仍会用 frontmatter 的 `slug` 覆盖文件名来生成 URL。

当前 6 篇内容的实际映射：

| 文件名 | frontmatter `slug` | 是否一致 |
| --- | --- | --- |
| `adding-new-post.md` | `adding-new-posts-in-astropaper-theme` | ❌ **不一致** |
| `group-meeting-2024-02-28.md` | `group-meeting-2024-02-28` | ✅ |
| `group-meeting-2024-03-06.md` | `group-meeting-2024-03-06` | ✅ |
| `group-meeting-2024-03-13.md` | `group-meeting-2024-03-13` | ✅ |
| `group-meeting-2024-03-20.md` | `group-meeting-2024-03-20` | ✅ |
| `group-meeting-2024-03-27.md` | `group-meeting-2024-03-27` | ✅ |

**结论**：迁移到 Content Layer 后，`/posts/adding-new-posts-in-astropaper-theme/` 这条 URL 会丢失（改用文件名或新的 id 生成规则）。
必须在新的 `src/content.config.ts` 中显式声明 `slug` 字段，或改用 `glob({ generateId })` 保留该 URL，否则会 404 / 变更且影响已有外链与搜索引擎索引。

（另注：`adding-new-post.md` 本身是 AstroPaper 主题自带示例文，也可考虑直接删除，此时该问题自动消失——但仍需保留重定向决策。）

---

## 3. 站点自定义补丁（升级时易被覆盖，需显式保留/重做）

| 位置 | 内容 | 影响 |
| --- | --- | --- |
| `src/utils/postFilter.ts:6` | `const isPublishTimePassed = true;`，`Date.now()` 判断被注释掉（对应 commit `d66afee disable the limit of pubDatetime`） | `SITE.scheduledPostMargin`（`src/config.ts:14`，15 分钟）实际失效，「立即发布」是硬编码行为。升级后若直接采用上游 `postFilter.ts`，定时发布行为会突然改变 —— **需明确决策：保留「立即发布」还是恢复定时语义。** |
| `src/config.ts:5` | `desc: "A minimal, responsive and SEO-friendly Astro blog theme."` | 模板文案残留，会进入 RSS / OG / sitemap，**建议尽快修正（与升级无关）** |
| `src/config.ts:9` | `// ogImage: "astropaper-og.jpg"` 被注释 | OG 图回退到生成的 PNG，确认符合预期 |
| `remark-collapse.d.ts` | 为 `remark-collapse` 手写的类型 shim | 升级后需重新验证（包本身若有类型定义则应删除该 shim） |
| `src/config.ts` 全文 | `SITE` / `LOCALE` / `LOGO_IMAGE` / `SOCIALS` | AstroPaper v6 重构了配置结构（见 §4 方案 B 说明），迁移时需按新结构重写 |
| `astro.config.ts:7,42` | `scopedStyleStrategy: "where"` | Astro 6 升级了 `@astrojs/compiler` 到 v3，样式作用域行为有相关回归报告，**升级后需重点验证 scoped styles** |

---

## 4. 升级路线

### 方案 A：原地逐级升级（4 → 5 → 6）

保留仓库历史与自定义补丁，按大版本逐级迁移，每级用官方 upgrade guide 处理 breaking change。

- 优点：不丢 git 历史，自定义代码原地演进。
- 缺点：需穿越两代 breaking change（Astro 5 内容层重构 + Astro 6 移除 legacy API），叠加 Tailwind 3→4 的重写；每一级都要重新验证同一套断言，总工作量最大。

### 方案 B（推荐）：以 AstroPaper v6.1.0 为基座重建

拉取 AstroPaper v6.1.0 最新脚手架，把本站内容与少量自定义搬过去。

- 迁移面很小：6 篇 markdown（内容与 frontmatter 结构基本兼容）、`src/config.ts` 的元数据、`postFilter.ts` 的一行 hack。
- 一次性获得：Astro 6 + Tailwind 4 + TS 6 的正确配置形态，避免自己重新推导 Tailwind 4 CSS-first 写法。
- 主要风险：AstroPaper v6 重构了配置结构（用统一的 config 文件取代了旧的 `SITE` / `constants.ts` 写法），且默认样式/布局可能有微调；`/posts/adding-new-posts-in-astropaper-theme/` URL 需按 §2.1 处理。

### 方案 C：冻结不升，仅打安全补丁

- **不推荐**。Astro 4 已 EOL；2026-04 有针对 Astro `define:vars` 的 XSS 公告（GHSA-j687-52p2-xcff，影响 ≤ 6.1.1），说明**即使升到 6.x 也要持续跟 patch**。拖得越久，跨过的 breaking change 越多。

### 推荐执行顺序

| 阶段 | 内容 | 风险 | 可独立回滚 |
| --- | --- | --- | --- |
| **阶段 0** | 工程卫生（§5）—— 与框架版本无关，先做 | 极低 | ✅ |
| **阶段 1** | 基座切换：建 `v6` 分支，从 AstroPaper v6.1.0 拉新脚手架，搬内容 + 显式声明 `slug` + 重贴 `postFilter` 逻辑 + 重写 `src/config.ts` | 中 | ✅（分支隔离） |
| **阶段 2** | 验证清单（§6）逐项过 | — | — |
| **阶段 3** | 工具链对齐：ESLint 9 flat config、husky 9、lint-staged 接入 eslint、`@astrojs/check` 升版、Actions 升版 | 低 | ✅ |
| **阶段 4** | 可选清理：`.npmrc`、`.eslintignore`、`.DS_Store`、jampack 去留、评估移除每日 cron 重建 | 低 | ✅ |

**时间窗口建议**：Astro 7 预计在 2027-03 前后发布（按 6.0 的节奏）。把 v6 迁移放在 2026 年内完成，就能在 Astro 7 发布时处于「只需跳一级」的位置。

---

## 5. 阶段 0：立即可做（不改框架，零/低风险）

1. **CI 改为跑构建脚本**：把 `.github/workflows/astro.yml` 的 `bun astro build --site ... --base ...` 换成 `bun run build`（注意：`--site`/`--base` 目前依赖 workflow 注入，改用脚本后需确认 `astro.config.ts:10` 的 `site: SITE.website` 已正确指向 `https://hnasgravity.github.io/` —— 已确认正确）。至少也要补一步 `bun astro check`。
2. **固定构建环境**：`bun-version` 写死具体版本（如 `1.4.2`），`bun install` 改为 `bun install --frozen-lockfile`。
3. **统一 lockfile**：二选一。建议保留文本 **`bun.lock`**（由 `bun install` 自动生成）并删除 `bun.lockb` 与 `package-lock.json`；若团队更依赖 npm，则反之。**不要长期保留两份。**
4. **加版本约束**：`package.json` 增加 `"engines": { "node": ">=22" }`（Astro 6 要求 Node ≥22，已弃用 Node 18/20）与 `"packageManager": "bun@1.4.2"`；加 `.nvmrc`（内容 `22`）。
5. **修正 `src/config.ts:5` 的 `desc`**（SEO，与升级无关，收益立竿见影）。
6. **jampack 去留决策**：`@divriots/jampack` 目前只在本地 `npm run build` 生效、CI 从未执行过；且该工具上游维护放缓。建议要么并入 CI（第 1 条已完成该效果），要么直接从依赖中移除。
7. **接入自动化**：Dependabot（或 Renovate）监控 npm 依赖与 GitHub Actions；新增 lint 作业跑 `eslint .` + `prettier --check .`。
8. **清理**：删除 `.npmrc`（`shamefully-hoist` 对 bun/npm 无效）、`.eslintignore`（ESLint 9 会移除该文件支持，届时一并处理）、工作区 `.DS_Store`。

---

## 6. 阶段 2：升级验收清单

升级后必须逐项确认，防止静默退化：

- [ ] **URL 兼容**：`/posts/adding-new-posts-in-astropaper-theme/` 仍可访问（或已决策删除 + 重定向，见 §2.1）
- [ ] 其余 5 篇 `/posts/group-meeting-*/` 路径与标题不变
- [ ] **OG 图生成**：`src/pages/og.png.ts`、`src/pages/posts/[slug]/index.png.ts` 正常输出；注意 `satori` + **React 19** 的兼容性（`src/utils/og-templates/*.tsx`）
- [ ] `@resvg/resvg-js` 在 `astro.config.ts:46` 的 `optimizeDeps.exclude` 配置在新版本下仍必要/生效
- [ ] **KaTeX**：`remark-math` + `rehype-katex`（`astro.config.ts:31,35`）渲染数学公式正常
- [ ] **目录折叠**：`remarkToc` + `remarkCollapse`（`astro.config.ts:28-34`，test: "Table of contents"）行为不变；`remark-collapse.d.ts` shim 是否还需要
- [ ] **Shiki 代码高亮**：`astro.config.ts:36-39` 的 `one-dark-pro` 主题 + `wrap: true` 生效
- [ ] **站内搜索**：`src/components/Search.tsx`（fuse.js）可用
- [ ] **RSS**：`src/pages/rss.xml.ts` + `@astrojs/rss` 输出正常
- [ ] **sitemap**：`@astrojs/sitemap` 输出且 URL 前缀正确
- [ ] **robots.txt**：`src/pages/robots.txt.ts` 正常
- [ ] **深色/浅色模式**：`src/config.ts:11` `lightAndDarkMode: true` + `src/styles/base.css` 的 CSS 变量（Tailwind 4 下需重写为 `@theme`）
- [ ] **分页**：`SITE.postPerPage`（`src/config.ts:12`，10）行为不变
- [ ] **样式作用域**：`scopedStyleStrategy: "where"` 的产物与视觉无回归
- [ ] **发布时机语义**：`postFilter.ts` 的「立即发布」行为是否按 §3 的决策保留
- [ ] **Lighthouse**：与仓库内 `AstroPaper-lighthouse-score.svg` 的基线对比无退化
- [ ] **构建产物**：`dist/` 大小、页面数量与升级前基本一致

---

## 7. 附：检查范围与未做的事

- 本次检查为**纯静态审查**：读取了 `package.json`、`package-lock.json`、`astro.config.ts`、`tsconfig.json`、`tailwind.config.cjs`、`.github/workflows/astro.yml`、`.eslintrc.js`、`.prettierrc`、`.npmrc`、`.husky/pre-commit`、`.vscode/*`、`src/` 目录结构与关键源文件。
- **未执行**：`bun install` / `npm install`、`astro dev`、`astro build`、`astro check`、任何部署操作。因此「当前构建是否真的通过」未经验证——建议在阶段 0 先在本地跑一次 `bun install && bun run build` 建立基线。
- 沙箱内网络受限（`registry.npmjs.org` 不可达），§1.1 的「生态当前」列来自公开检索结果，实施时请以 registry 实际输出为准。
