<script lang="ts">
  import { notes, type NoteDoc } from '../notes.svelte'
  import {
    FORCED_SEARCH_QUERY,
    forced,
    scopedNotes,
    scopeName,
    selectNote,
    startNewNote,
    ui,
  } from '../ui-state.svelte'
  import EmptyState from '../components/EmptyState.svelte'
  import Icon from '../components/Icon.svelte'
  import NoteCard from '../components/NoteCard.svelte'
  import PrimaryButton from '../components/PrimaryButton.svelte'
  import SearchInput from '../components/SearchInput.svelte'

  let query = $state(forced.searchEmpty ? FORCED_SEARCH_QUERY : '')

  // 최근 수정 순. 선택된 노트만 선택한 순간의 수정 시각으로 정렬해, 편집하는 동안 제자리에 둔다 (design.md D6)
  const sortKey = (note: NoteDoc) =>
    note.id === ui.selectedNoteId && ui.pinnedSortKey !== null ? ui.pinnedSortKey : note.updatedAt
  const title = $derived(scopeName(ui.scope))
  const inScopeNotes = $derived(scopedNotes())
  const sortedNotes = $derived(
    inScopeNotes.toSorted((a, b) => sortKey(b).localeCompare(sortKey(a)) || a.id.localeCompare(b.id)),
  )
</script>

<section class="note-list" aria-labelledby="note-list-title">
  <header class="header">
    <button
      id="sidebar-toggle"
      type="button"
      class="menu"
      aria-label="메뉴 열기"
      aria-controls="sidebar"
      aria-expanded={ui.sidebarOpen}
      onclick={() => (ui.sidebarOpen = true)}
    >
      <Icon name="menu" />
    </button>
    <!-- 노트를 삭제한 뒤 포커스를 받는 자리 (design.md D5) -->
    <h2 id="note-list-title" class="title" tabindex="-1">{title}</h2>
  </header>

  <SearchInput bind:value={query} />

  {#if forced.searchEmpty}
    <EmptyState
      icon="search"
      title="일치하는 노트가 없어요"
      description="검색어를 줄이거나 다른 단어로 찾아보세요."
    />
  {:else if inScopeNotes.length === 0 && ui.scope.kind === 'folder'}
    <EmptyState icon="folder" title="{title}에 노트를 모아 둘 수 있어요" description="새 노트를 만들면 이 폴더에 바로 담겨요.">
      {#snippet action()}
        <PrimaryButton icon="plus" onclick={startNewNote}>새 노트</PrimaryButton>
      {/snippet}
    </EmptyState>
  {:else if notes.length === 0}
    <EmptyState icon="file-text" title="아직 노트가 없어요" description="떠오른 생각을 바로 적어 두세요.">
      {#snippet action()}
        <PrimaryButton icon="plus" onclick={startNewNote}>새 노트</PrimaryButton>
      {/snippet}
    </EmptyState>
  {:else if inScopeNotes.length === 0}
    <EmptyState icon="inbox" title="모든 노트가 폴더에 정리되어 있어요" description="폴더에 넣지 않은 노트가 여기에 모여요." />
  {:else}
    <ul class="cards">
      {#each sortedNotes as note (note.id)}
        <li>
          <NoteCard {note} selected={ui.selectedNoteId === note.id} onselect={() => selectNote(note.id)} />
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .note-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    height: 100%;
    padding: var(--spacing-xl) var(--spacing-lg);
    overflow-y: auto;
    background: var(--color-canvas);
  }

  .header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .title {
    min-width: 0;
    color: var(--color-foreground);
    font-size: var(--type-h2-size);
    font-weight: var(--type-h2-weight);
    line-height: var(--type-h2-line);
    overflow-wrap: anywhere;
  }

  .menu {
    display: none;
    flex-shrink: 0;
    place-items: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-body);
  }

  .menu:hover {
    background: var(--color-surface);
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin: 0 calc(-1 * var(--spacing-md));
    padding: 0;
    list-style: none;
  }

  @media (max-width: 1023px) {
    .menu {
      display: grid;
    }
  }
</style>
