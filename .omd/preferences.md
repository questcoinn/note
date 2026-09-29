---
schema: omd.preferences/v1
design_md_hash_at_creation: sha256:97b5dd1bad591b4161e9c285b172294026d057a38a7342ed6d688c95ec852ff5
---

# Preference Log

## 2026-09-28T04:45:21.991Z — sidebar-folder-and-tag-group-headers-use

```omd-meta
id: pref_mukrkreu_40ea79df
timestamp: 2026-09-28T04:45:21.991Z
scope: components.navigation
signal: user-correction
confidence: explicit
status: applied
applied_at: 2026-09-28T04:52:00.000Z
applied_design_md_hash: 2f41741daba0b22642a8e7c246a5fd3d1ad1597e1a8d2bd38aaa817a0c442678
source_agent: claude-code
source_context: "src/lib/layout/Sidebar.svelte"
```

Sidebar folder and tag group headers use 24px instead of 30px (the h2 role felt slightly too large on screen)

## 2026-09-29T02:41:02.653Z — add-folder-menu-component-sidebar-folder

```omd-meta
id: pref_mum2kqf2_bbf06a02
timestamp: 2026-09-29T02:41:02.653Z
scope: components.navigation
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-09-29T02:55:00.000Z
applied_design_md_hash: 9a06b1837047b59aa131b72f9c8434db0dc3b4587e4392eb3781c1454a9953fe
source_agent: claude-code
source_context: "openspec/changes/add-note-folders/design.md#D7"
```

Add a folder-menu component: each sidebar folder row has an always-visible menu button (accessible name "<folder> 폴더 메뉴", aria-haspopup=menu) opening a popover menu with "이름 바꾸기" and "삭제"; the delete item uses color.danger text; the menu surface is color.canvas with a color.border edge and no shadow; states default/hover/focus-visible/open; supports arrow keys, Esc and outside click to close with focus returned to the button

## 2026-09-29T02:41:02.708Z — add-folder-select-component-in-editor-hea

```omd-meta
id: pref_mum2kqgl_4e582346
timestamp: 2026-09-29T02:41:02.708Z
scope: components.dropdown
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-09-29T02:55:00.000Z
applied_design_md_hash: 9a06b1837047b59aa131b72f9c8434db0dc3b4587e4392eb3781c1454a9953fe
source_agent: claude-code
source_context: "openspec/changes/add-note-folders/design.md#D4"
```

Add a folder-select component: a native select in the editor header labelled "폴더" that shows the open note's folder, with options "폴더 없음" followed by folders in Korean alphabetical order; uses color.border, radius.md, color.foreground text; states default/hover/focus-visible; changing it moves the note immediately without changing its modified time

## 2026-09-29T02:41:02.763Z — add-text-field-component-for-the-folder-n

```omd-meta
id: pref_mum2kqi3_e5244846
timestamp: 2026-09-29T02:41:02.763Z
scope: components.input
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-09-29T02:55:00.000Z
applied_design_md_hash: 9a06b1837047b59aa131b72f9c8434db0dc3b4587e4392eb3781c1454a9953fe
source_agent: claude-code
source_context: "openspec/changes/add-note-folders/design.md#D6"
```

Add a text-field component for the folder name dialog: visible label, color.border default border, radius.md, primary focus ring; an error state with color.danger border and a color.danger message linked via aria-describedby and aria-invalid; states default/hover/focus-visible/error; used inside a modal dialog with 취소 and 만들기/저장 actions

## 2026-09-29T02:41:02.818Z — sidebar-nav-item-gains-an-unfiled-variant

```omd-meta
id: pref_mum2kqjn_95f60287
timestamp: 2026-09-29T02:41:02.818Z
scope: components.navigation
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-09-29T02:55:00.000Z
applied_design_md_hash: 9a06b1837047b59aa131b72f9c8434db0dc3b4587e4392eb3781c1454a9953fe
source_agent: claude-code
source_context: "openspec/changes/add-note-folders/design.md#D8"
```

sidebar-nav-item gains an "unfiled" variant for the fixed "폴더 없음" item placed right below "전체 노트"; like all-notes it cannot be renamed or deleted and has no menu button; folder rows now carry a trailing menu button and every item is clickable to scope the note list

## 2026-09-29T03:23:40.823Z — color-danger-token-changes-from-e42939-to

```omd-meta
id: pref_mum43kbc_9d7d2a85
timestamp: 2026-09-29T03:23:40.823Z
scope: color
signal: user-correction
confidence: explicit
status: applied
applied_at: 2026-09-29T03:25:00.000Z
applied_design_md_hash: bc964d16da70cfaea5c43d480725fac1ce38fe9f17c7db551312975cba56f324
source_agent: claude-code
source_context: "src/app.css"
```

color.danger token changes from #e42939 to #dc2535 so danger text meets 4.5:1 on canvas (#e42939 was 4.49:1)

## 2026-09-29T03:32:14.185Z — keep-color-border-as-the-default-input-bord

```omd-meta
id: pref_mum4ekef_62ef9b27
timestamp: 2026-09-29T03:32:14.185Z
scope: components.input
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-09-29T03:34:00.000Z
applied_design_md_hash: 95ba02e3c6923eae7be80c65fce0ed388119640deb3b08021277a3d1b466cb0d
source_agent: claude-code
source_context: "src/lib/components/SearchInput.svelte"
```

Keep color.border as the default input border even though it is 1.23:1 on canvas (below WCAG 1.4.11 3:1); inputs stay identifiable because every input has a visible label or a leading icon with placeholder, and hover (color.muted, 3:1) and focus (primary ring) give a 3:1 boundary; never ship an input identified only by its border
