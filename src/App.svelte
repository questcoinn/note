<script lang="ts">
  import EditorPane from './lib/layout/EditorPane.svelte'
  import NoteList from './lib/layout/NoteList.svelte'
  import Sidebar from './lib/layout/Sidebar.svelte'
  import { tick } from 'svelte'
  import { selectNote, ui } from './lib/ui-state.svelte'

  // Cmd/Ctrl+K는 어디서든 검색 입력으로 간다. 모달이 열려 있으면 모달 안에 머문다 (add-note-search design.md D7)
  async function onkeydown(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== 'k') return
    if (document.querySelector('dialog:modal')) return
    event.preventDefault()
    // 오버레이의 close()와 달리 포커스를 토글 버튼으로 돌려주지 않는다. 포커스는 검색 입력으로 간다
    ui.sidebarOpen = false
    // 좁은 폭에서는 상세가 목록을 가리므로 "목록으로" 버튼과 같은 경로로 목록에 돌아간다
    if (ui.selectedNoteId !== null && window.matchMedia('(max-width: 767px)').matches) selectNote(null)
    await tick()
    const input = document.getElementById('note-search-input')
    if (input instanceof HTMLInputElement) {
      input.focus()
      input.select()
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="app" class:has-selection={ui.selectedNoteId !== null}>
  <div class="area sidebar-area"><Sidebar /></div>
  <main class="area list-area"><NoteList /></main>
  <div class="area editor-area"><EditorPane /></div>
</div>

<style>
  /* 브레이크포인트 — design.md D7 */
  .app {
    display: grid;
    grid-template-columns: 240px 320px minmax(0, 1fr);
    height: 100dvh;
  }

  .area {
    min-width: 0;
    min-height: 0;
  }

  .editor-area {
    border-left: 1px solid var(--color-border);
  }

  @media (max-width: 1023px) {
    .app {
      grid-template-columns: 320px minmax(0, 1fr);
    }

    /* 사이드바는 fixed 오버레이라 그리드 칸을 차지하지 않는다 */
    .sidebar-area {
      display: contents;
    }
  }

  @media (max-width: 767px) {
    .app {
      grid-template-columns: minmax(0, 1fr);
    }

    .editor-area {
      border-left: none;
    }

    .app:not(.has-selection) .editor-area,
    .app.has-selection .list-area {
      display: none;
    }
  }
</style>
