<script lang="ts">
  import { notes } from '../notes.svelte'
  import { startNewNote, ui } from '../ui-state.svelte'
  import Icon from '../components/Icon.svelte'
  import PrimaryButton from '../components/PrimaryButton.svelte'
  import SidebarNavItem from '../components/SidebarNavItem.svelte'

  let closeButton: HTMLButtonElement | undefined = $state()

  function close() {
    ui.sidebarOpen = false
    document.getElementById('sidebar-toggle')?.focus()
  }

  // 오버레이가 열리면 닫기 버튼으로 포커스를 옮긴다
  $effect(() => {
    if (ui.sidebarOpen) closeButton?.focus()
  })

  function onkeydown(event: KeyboardEvent) {
    if (ui.sidebarOpen && event.key === 'Escape') close()
  }
</script>

<svelte:window {onkeydown} />

{#if ui.sidebarOpen}
  <!-- 키보드 사용자는 닫기 버튼과 Esc로 닫는다. 배경 클릭은 포인터 보조 수단 -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="scrim" aria-hidden="true" onclick={close}></div>
{/if}

<nav id="sidebar" class="sidebar" class:open={ui.sidebarOpen} aria-label="노트 탐색">
  <div class="top">
    <p class="app-name">노트</p>
    <button bind:this={closeButton} type="button" class="close" aria-label="메뉴 닫기" onclick={close}>
      <Icon name="x" />
    </button>
  </div>

  <PrimaryButton icon="plus" block onclick={startNewNote}>새 노트</PrimaryButton>

  <ul class="group">
    <li>
      <SidebarNavItem variant="all-notes" label="전체 노트" count={notes.length} active />
    </li>
  </ul>
</nav>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    height: 100%;
    padding: var(--spacing-xl) var(--spacing-lg);
    overflow-y: auto;
    background: var(--color-surface);
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 40px;
  }

  .app-name {
    color: var(--color-foreground);
    font-size: 17px;
    font-weight: 700;
  }

  .close {
    display: none;
    place-items: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-body);
  }

  .close:hover {
    background: var(--color-border);
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .scrim {
    display: none;
  }

  /* 1024px 미만: 그림자 없는 불투명 오버레이 (design.md D7·D8) */
  @media (max-width: 1023px) {
    .sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      z-index: 20;
      display: none;
      width: min(300px, 85vw);
      background: var(--color-canvas);
    }

    .sidebar.open {
      display: flex;
    }

    .close {
      display: grid;
    }

    .scrim {
      position: fixed;
      inset: 0;
      z-index: 10;
      display: block;
      background: color-mix(in srgb, var(--color-foreground) 50%, transparent);
    }
  }
</style>
