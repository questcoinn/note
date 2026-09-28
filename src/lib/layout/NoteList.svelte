<script lang="ts">
  import { EMPTY_FOLDER_ID, folderById } from '../mock/data'
  import { notes, type NoteDoc } from '../notes.svelte'
  import { FORCED_SEARCH_QUERY, forced, selectNote, ui } from '../ui-state.svelte'
  import EmptyState from '../components/EmptyState.svelte'
  import Icon from '../components/Icon.svelte'
  import NoteCard from '../components/NoteCard.svelte'
  import PrimaryButton from '../components/PrimaryButton.svelte'
  import SearchInput from '../components/SearchInput.svelte'

  let query = $state(forced.searchEmpty ? FORCED_SEARCH_QUERY : '')

  // 검색 강제 상태가 폴더 강제 상태보다 우선한다 (design.md D6)
  const showFolderEmpty = forced.folderEmpty && !forced.searchEmpty
  const emptyFolderName = folderById.get(EMPTY_FOLDER_ID)?.name ?? ''
  const scopeTitle = showFolderEmpty ? emptyFolderName : '전체 노트'

  // 최근 수정 순. 선택된 노트만 선택한 순간의 수정 시각으로 정렬해, 편집하는 동안 제자리에 둔다 (design.md D6)
  const sortKey = (note: NoteDoc) =>
    note.id === ui.selectedNoteId && ui.pinnedSortKey !== null ? ui.pinnedSortKey : note.updatedAt
  const sortedNotes = $derived(
    notes.toSorted((a, b) => sortKey(b).localeCompare(sortKey(a)) || a.id.localeCompare(b.id)),
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
    <h2 id="note-list-title" class="title">{scopeTitle}</h2>
  </header>

  <SearchInput bind:value={query} />

  {#if forced.searchEmpty}
    <EmptyState
      icon="search"
      title="일치하는 노트가 없어요"
      description="검색어를 줄이거나 다른 단어로 찾아보세요."
    />
  {:else if showFolderEmpty}
    <EmptyState
      icon="folder"
      title="{emptyFolderName}에 노트를 모아 둘 수 있어요"
      description="새 노트를 만들면 이 폴더에 바로 담겨요."
    >
      {#snippet action()}
        <PrimaryButton icon="plus">새 노트</PrimaryButton>
      {/snippet}
    </EmptyState>
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
