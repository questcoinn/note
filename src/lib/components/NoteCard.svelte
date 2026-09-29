<script lang="ts">
  import { clock, formatUpdatedLabel } from '../clock.svelte'
  import type { NoteDoc } from '../notes.svelte'

  let {
    note,
    selected = false,
    onselect,
  }: {
    note: NoteDoc
    selected?: boolean
    onselect: () => void
  } = $props()
</script>

<!-- 제목 버튼을 카드 전체로 늘려 카드 어디를 눌러도 열린다. 카드 안에 다른 버튼(예: 태그 칩)이 생겨도 중첩 버튼이 되지 않는다 -->
<article class="note-card" class:selected>
  <h3 class="title">
    <button type="button" class="hit" aria-current={selected ? 'true' : undefined} onclick={onselect}>
      {note.title}
    </button>
  </h3>
  {#if note.snippet}
    <p class="snippet">{note.snippet}</p>
  {/if}
  <div class="meta">
    <span class="timestamp">{formatUpdatedLabel(note.updatedAt, clock.now)}</span>
  </div>
</article>

<style>
  .note-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-lg);
    border-radius: var(--radius-card);
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .note-card:hover {
    background: var(--color-surface);
  }

  .note-card.selected {
    background: var(--color-weak-background);
  }

  .note-card:has(.hit:focus-visible) {
    box-shadow: var(--focus-ring);
  }

  .title {
    font-size: var(--type-h3-size);
    font-weight: var(--type-h3-weight);
    line-height: var(--type-h3-line);
    color: var(--color-foreground);
  }

  .hit {
    all: unset;
    cursor: pointer;
    overflow-wrap: anywhere;
  }

  .hit::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  .hit:focus-visible {
    box-shadow: none;
  }

  .snippet {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
    color: var(--color-body);
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-md);
    margin-top: var(--spacing-xs);
  }

  .timestamp {
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
    color: var(--color-muted);
  }
</style>
