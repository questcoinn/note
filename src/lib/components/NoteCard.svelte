<script lang="ts">
  import { clock, formatUpdatedLabel } from '../clock.svelte'
  import type { NoteDoc } from '../notes.svelte'
  import { excerpt, highlight, type Segment } from '../search'
  import { tagKey } from '../tags'
  import TagChip from './TagChip.svelte'

  let {
    note,
    selected = false,
    onselect,
    currentTagKey,
    onselecttag,
    terms = [],
  }: {
    note: NoteDoc
    selected?: boolean
    onselect: () => void
    // 지금 보고 있는 태그 범위의 키. 그 칩은 selected로 보이고 눌러도 아무것도 하지 않는다
    currentTagKey?: string
    onselecttag: (name: string) => void
    // 검색 단어. 비어 있으면 검색하지 않을 때의 카드다
    terms?: string[]
  } = $props()

  // 대체 제목("제목 없음")은 내용이 아니라서 하이라이트하지 않는다 (add-note-search design.md D4)
  const titleSegments = $derived(terms.length > 0 && note.searchText.title ? highlight(note.title, terms) : null)
  // 본문에 일치가 없으면 null이고 원래 스니펫을 쓴다
  const excerptSegments = $derived(terms.length > 0 ? excerpt(note.searchText.body, terms) : null)
</script>

{#snippet marked(segments: Segment[])}{#each segments as segment, i (i)}{#if segment.mark}<mark>{segment.text}</mark>{:else}{segment.text}{/if}{/each}{/snippet}

<!-- 제목 버튼을 카드 전체로 늘려 카드 어디를 눌러도 열린다. 카드 안에 다른 버튼(예: 태그 칩)이 생겨도 중첩 버튼이 되지 않는다 -->
<article class="note-card" class:selected>
  <h3 class="title">
    <button type="button" class="hit" aria-current={selected ? 'true' : undefined} onclick={onselect}>
      {#if titleSegments}{@render marked(titleSegments)}{:else}{note.title}{/if}
    </button>
  </h3>
  {#if excerptSegments}
    <p class="snippet">{@render marked(excerptSegments)}</p>
  {:else if note.snippet}
    <p class="snippet">{note.snippet}</p>
  {/if}
  <div class="meta">
    <span class="timestamp">{formatUpdatedLabel(note.updatedAt, clock.now)}</span>
    {#if note.tags.length > 0}
      <ul class="tags" aria-label="태그">
        {#each note.tags as tag (tag)}
          {@const current = tagKey(tag) === currentTagKey}
          <li>
            <TagChip label={tag} selected={current} onclick={() => current || onselecttag(tag)} />
          </li>
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

  .tags {
    /* 늘린 제목 버튼 위로 올려 칩이 따로 눌리게 한다 */
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    min-width: 0;
    max-width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .tags li {
    min-width: 0;
    max-width: 100%;
  }

  /* selected 카드의 배경과 weak 칩 배경이 같아 칩을 canvas로 띄운다. 지금 보는 태그의 칩은 selected 색을 유지한다 */
  .selected :global(.tag-chip.weak:not(.selected)) {
    background: var(--color-canvas);
  }

  .selected :global(.tag-chip.weak:not(.selected):hover) {
    background: var(--color-weak-background);
  }

  /* 검색 일치 하이라이트. 글자 사이에 끼므로 여백 없이 배경 면으로만 구분한다 */
  mark {
    border-radius: var(--radius-sm);
    background: var(--color-weak-background);
    color: var(--color-weak-foreground);
  }

  /* selected 카드의 배경과 하이라이트 배경이 같아 canvas로 띄운다 */
  .selected mark {
    background: var(--color-canvas);
  }

  .timestamp {
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
    color: var(--color-muted);
  }
</style>
