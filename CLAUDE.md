<!-- omd:start v=1 hash=a0905ab87d60 -->
# Design System (oh-my-design)

Read the standalone design contract at **@./DESIGN.md** before any UI,
styling, microcopy, or motion work. When a valid adopted Core v2
`.omd/system/manifest.json` declares `profile: portable-core` and binds exact
graph/projection hashes, the System Graph is machine authority and DESIGN.md is
its standalone projection. A migration candidate is never adopted authority.

Preference log (pending corrections): @./.omd/preferences.md

Precedence: pending explicit preference corrections > adopted Bound System
graph/standalone DESIGN.md > your defaults. Fold pending corrections into the
graph and regenerate the projection before clearing them.
<!-- omd:end -->

## Browser support

Baseline Newly available 기능(예: Popover API)은 폴리필 없이 쓴다. 이를 지원하지 않는 브라우저(예: iOS Safari 18.3 미만)는 지원 범위 밖이다. Baseline이 아닌 기능(예: CSS anchor positioning)은 쓰지 않거나 기능 감지 뒤 점진적 향상으로만 쓴다.
