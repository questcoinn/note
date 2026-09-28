<script lang="ts">
  import EditorPane from './lib/layout/EditorPane.svelte'
  import NoteList from './lib/layout/NoteList.svelte'
  import Sidebar from './lib/layout/Sidebar.svelte'
  import { ui } from './lib/ui-state.svelte'
</script>

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
