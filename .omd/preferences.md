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

## 2026-09-29T06:21:07.444Z — add-a-tag-input-component-editor-tag-row

```omd-meta
id: pref_mumafr6g_60361f45
timestamp: 2026-09-29T06:21:07.444Z
scope: components.input
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-09-29T06:24:34.946Z
applied_design_md_hash: 6ad30037dc092ea09a209e4c3f0503c47c5aa2146c77fc5831e6e7ff66e18e2e
source_agent: claude-code
source_context: "openspec/changes/add-note-tags/design.md#D6"
```

Add a tag-input component: a row below the editor header with a visible "태그" label, the note's removable tag chips, and an always-visible text input (placeholder, color.border default border, color.muted hover, primary focus ring, radius.md) backed by a native datalist of existing tags; Enter adds a tag (ignored during IME composition), Backspace never removes tags; states default/hover/focus-visible; no error state because empty or duplicate names are silently ignored

## 2026-09-29T06:21:07.444Z — tag-chip-gains-a-removable-variant-and-nav

```omd-meta
id: pref_mumafr7j_263fb5f9
timestamp: 2026-09-29T06:21:07.444Z
scope: components.badge
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-09-29T06:24:34.946Z
applied_design_md_hash: 6ad30037dc092ea09a209e4c3f0503c47c5aa2146c77fc5831e6e7ff66e18e2e
source_agent: claude-code
source_context: "openspec/changes/add-note-tags/design.md#D5"
```

tag-chip gains a removable variant (label plus an x button named "<tag> 태그 떼기", used in the editor tag row, label itself not clickable); the note-card chip is a navigation button that switches the note list to that tag's scope and moves focus to the list title; the chip for the tag currently viewed is selected and exposed with aria-current, not aria-pressed; chips shown on a selected note card use color.canvas background; long names wrap

## 2026-09-29T06:21:07.444Z — remove-the-tag-variant-from-sidebar-nav-it

```omd-meta
id: pref_mumafr8l_6f30003d
timestamp: 2026-09-29T06:21:07.444Z
scope: components.navigation
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-09-29T06:24:34.946Z
applied_design_md_hash: 6ad30037dc092ea09a209e4c3f0503c47c5aa2146c77fc5831e6e7ff66e18e2e
source_agent: claude-code
source_context: "openspec/changes/add-note-tags/proposal.md"
```

Remove the tag variant from sidebar-nav-item: the sidebar has no tag list, tags are cross-links reached only through note-card chips; while a tag scope is shown no sidebar item is active

## 2026-09-29T06:21:07.444Z — layout-sidebar-holds-folders-only

```omd-meta
id: pref_mumafr9r_3c64b2e6
timestamp: 2026-09-29T06:21:07.444Z
scope: layout
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-09-29T06:24:34.946Z
applied_design_md_hash: 6ad30037dc092ea09a209e4c3f0503c47c5aa2146c77fc5831e6e7ff66e18e2e
source_agent: claude-code
source_context: "openspec/changes/add-note-tags/design.md#D8"
```

Layout wording: the three columns are sidebar (all notes, unfiled, folders) · note list · editor+preview, not "sidebar (folders/tags)"; the h3 role usage becomes "note card title, sidebar folder group header"; the primary task "태그와 폴더로 노트 분류 및 탐색" becomes folders for classification and tags for jumping between related notes

## 2026-10-07T03:15:51.502Z — note-card-gains-search-match-display-while

```omd-meta
id: pref_muxjcbgn_ac4f1db9
timestamp: 2026-10-07T03:15:51.502Z
scope: components.card
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-10-07T03:18:51.251Z
applied_design_md_hash: c8a47b2d9cf2edd9a51cd6f5684e0dc0f8f5e7849845f408b7b6a8946d52d74b
source_agent: claude-code
source_context: "openspec/changes/add-note-search/design.md#D4"
```

note-card gains search-match display: while a search query is present, matched parts of the title are highlighted, and the snippet slot shows an excerpt of the first body line containing a search term (at most 24 characters before the first match, starting with … when cut; the end is left to the existing two-line clamp) with every search term inside it highlighted; highlights are <mark> using color.weak-background with color.weak-foreground text and radius.sm, and inside a selected card the highlight background becomes color.canvas; when the body has no match the regular snippet is shown without highlight; anatomy adds search-excerpt and highlight

## 2026-10-07T03:15:51.502Z — search-input-filters-the-current-scope-esc

```omd-meta
id: pref_muxjcbho_31e7fe38
timestamp: 2026-10-07T03:15:51.502Z
scope: components.input
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-10-07T03:18:51.251Z
applied_design_md_hash: c8a47b2d9cf2edd9a51cd6f5684e0dc0f8f5e7849845f408b7b6a8946d52d74b
source_agent: claude-code
source_context: "openspec/changes/add-note-search/design.md#D5"
```

search-input now filters the current scope's note list; Esc while focused clears the query (ignored during IME composition) and Cmd/Ctrl+K focuses it and selects its value; the no-results state reads "일치하는 노트가 없어요" and, when the scope is not all notes and other notes match, explains "다른 곳에 일치하는 노트가 N개 있어요." with a "전체 노트에서 보기" primary-button, otherwise "검색어를 줄이거나 다른 단어로 찾아보세요." with no button; the scope name is never put in the copy

## 2026-10-07T06:58:19.284Z — markdown-toolbar-button-toggles-markdown-on

```omd-meta
id: pref_muxraeqc_175e43e5
timestamp: 2026-10-07T06:58:19.284Z
scope: components.button
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-10-07T07:12:17.000Z
applied_design_md_hash: ba1d7c8e5141c608c40441197df6ecf371cfa9f38916d19610619e9c754bb605
source_agent: claude-code
source_context: "openspec/changes/add-markdown-formatting/design.md#D3"
```

markdown-toolbar-button toggles markdown on the source selection and returns focus to the source with the result selected; "active" is only the pressed-while-clicking state and there is no cursor-context pressed state (no aria-pressed); the toolbar uses roving tabindex (one Tab stop, Left/Right arrows wrap, Home/End); Cmd/Ctrl+B applies bold and Cmd/Ctrl+I italic inside the markdown source, and link has no shortcut because Cmd/Ctrl+K is search

## 2026-10-07T06:58:19.284Z — layout-hide-formatting-toolbar-on-preview-tab

```omd-meta
id: pref_muxraeqd_4f643e2b
timestamp: 2026-10-07T06:58:19.284Z
scope: layout
signal: user-statement
confidence: explicit
status: applied
applied_at: 2026-10-07T07:12:17.000Z
applied_design_md_hash: ba1d7c8e5141c608c40441197df6ecf371cfa9f38916d19610619e9c754bb605
source_agent: claude-code
source_context: "openspec/changes/add-markdown-formatting/design.md#D6"
```

Below 1024px, while the preview tab is selected the formatting toolbar is hidden; it shows on the edit tab and always at 1024px and wider
