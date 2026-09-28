<script lang="ts">
  import type { Note } from '../mock/data'
  import { tagById } from '../mock/data'
  import TagChip from './TagChip.svelte'

  let {
    note,
    selected = false,
    onselect,
  }: {
    note: Note
    selected?: boolean
    onselect: () => void
  } = $props()
</script>

<!-- 카드 안의 태그 칩도 버튼이라, 제목 버튼을 카드 전체로 늘리는 방식으로 중첩 버튼을 피한다 -->
<article class="note-card" class:selected>
  <h3 class="title">
    <button type="button" class="hit" aria-current={selected ? 'true' : undefined} onclick={onselect}>
      {note.title}
    </button>
  </h3>
  <p class="snippet">{note.snippet}</p>
  <div class="meta">
    <span class="timestamp">{note.updatedLabel}</span>
    {#if note.tagIds.length > 0}
      <ul class="tags" aria-label="태그">
        {#each note.tagIds as tagId (tagId)}
          <li><TagChip label={tagById.get(tagId)?.name ?? tagId} /></li>
        {/each}
      </ul>
    {/if}
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

  .tags {
    /* 늘린 제목 버튼 위로 올려 칩이 따로 눌리게 한다 */
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .selected :global(.tag-chip.weak) {
    background: var(--color-canvas);
  }
</style>
