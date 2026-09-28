<script lang="ts">
  import { noteById } from '../notes.svelte'
  import { forced, ui, type EditorTab } from '../ui-state.svelte'
  import ConfirmDialog from '../components/ConfirmDialog.svelte'
  import EmptyState from '../components/EmptyState.svelte'
  import Icon from '../components/Icon.svelte'
  import MarkdownToolbarButton from '../components/MarkdownToolbarButton.svelte'
  import PrimaryButton from '../components/PrimaryButton.svelte'
  import SaveStatusIndicator from '../components/SaveStatusIndicator.svelte'

  const note = $derived(ui.selectedNoteId ? noteById.get(ui.selectedNoteId) : undefined)
  // URL 강제 상태가 우선하고, 없으면 이번 세션의 편집 여부로 정한다
  const saveStatus = $derived(forced.save ?? (note?.dirty ? 'unsaved' : 'saved'))
  const tabId = $props.id()

  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'edit', label: '편집' },
    { id: 'preview', label: '미리보기' },
  ]
  const toolbar = ['bold', 'italic', 'heading', 'link', 'list', 'code'] as const
</script>

<section class="editor-pane" aria-label="노트 편집">
  {#if !note}
    <div class="empty">
      <EmptyState icon="file-text" title="노트를 선택하거나 새로 만들어 보세요">
        {#snippet action()}
          <PrimaryButton icon="plus">새 노트</PrimaryButton>
        {/snippet}
      </EmptyState>
    </div>
  {:else}
    <header class="topbar">
      <button type="button" class="icon-button back" aria-label="목록으로" onclick={() => (ui.selectedNoteId = null)}>
        <Icon name="arrow-left" />
      </button>
      <SaveStatusIndicator status={saveStatus} />
      <button type="button" class="icon-button delete" aria-label="노트 삭제" onclick={() => (ui.deleteDialogOpen = true)}>
        <Icon name="trash" />
      </button>
    </header>

    <div class="toolbar" role="toolbar" aria-label="서식">
      {#each toolbar as variant (variant)}
        <MarkdownToolbarButton {variant} />
      {/each}
    </div>

    <div class="tabs" role="tablist" aria-label="보기 전환">
      {#each tabs as tab (tab.id)}
        <button
          type="button"
          role="tab"
          id="{tabId}-{tab.id}-tab"
          class="tab"
          aria-selected={ui.editorTab === tab.id}
          aria-controls="{tabId}-{tab.id}"
          onclick={() => (ui.editorTab = tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="panes" data-tab={ui.editorTab}>
      <div id="{tabId}-edit" class="pane source-pane" role="tabpanel" aria-labelledby="{tabId}-edit-tab">
        <label class="visually-hidden" for="{tabId}-source">마크다운 원문</label>
        <textarea
          id="{tabId}-source"
          class="source"
          spellcheck="false"
          bind:value={note.source}
          oninput={() => note && (note.dirty = true)}
        ></textarea>
      </div>
      <!-- note.html은 사용자 입력에서 만들어지지만 markdown/render.ts에서 DOMPurify로 정화된 값이다. 정화를 거치지 않은 HTML을 여기에 넣지 말 것 -->
      <div id="{tabId}-preview" class="pane preview" role="tabpanel" aria-labelledby="{tabId}-preview-tab">
        {@html note.html}
      </div>
    </div>

    <ConfirmDialog
      bind:open={ui.deleteDialogOpen}
      title="‘{note.title}’ 노트가 영구히 삭제돼요"
      description="삭제한 노트는 되돌릴 수 없어요."
      confirmLabel="삭제"
      onconfirm={() => (ui.deleteDialogOpen = false)}
    />
  {/if}
</section>

<style>
  .editor-pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--color-canvas);
  }

  .empty {
    display: grid;
    place-items: center;
    flex: 1;
  }

  .topbar {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .topbar :global(.save-status) {
    flex: 1;
  }

  .icon-button {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-body);
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .icon-button:hover {
    background: var(--color-surface);
  }

  .delete:hover {
    color: var(--color-danger);
  }

  .back {
    display: none;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    padding: 0 var(--spacing-lg) var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  .tabs {
    display: none;
    gap: var(--spacing-xs);
    padding: var(--spacing-md) var(--spacing-lg) 0;
    border-bottom: 1px solid var(--color-border);
  }

  .tab {
    min-height: 44px;
    padding: 0 var(--spacing-lg);
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--color-body);
    font-weight: 600;
  }

  .tab:hover {
    color: var(--color-foreground);
  }

  .tab[aria-selected='true'] {
    border-bottom-color: var(--color-primary);
    color: var(--color-weak-foreground);
  }

  .panes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex: 1;
    min-height: 0;
  }

  .pane {
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
  }

  .source-pane {
    display: flex;
    border-right: 1px solid var(--color-border);
  }

  .source {
    flex: 1;
    width: 100%;
    padding: var(--spacing-xl);
    border: none;
    background: var(--color-canvas);
    color: var(--color-foreground);
    font-family: var(--font-mono);
    font-size: var(--type-code-size);
    line-height: var(--type-code-line);
    resize: none;
  }

  .source:focus-visible {
    box-shadow: inset 0 0 0 2px var(--color-primary);
  }

  /* 미리보기 — DESIGN.md 타입 역할 */
  .preview {
    padding: var(--spacing-xl);
    color: var(--color-body);
    overflow-wrap: anywhere;
  }

  .preview :global(* + *) {
    margin-top: var(--spacing-lg);
  }

  .preview :global(li + li) {
    margin-top: var(--spacing-xs);
  }

  .preview :global(h1) {
    color: var(--color-foreground);
    font-size: var(--type-h1-size);
    font-weight: var(--type-h1-weight);
    line-height: var(--type-h1-line);
  }

  .preview :global(h2) {
    margin-top: var(--spacing-xxl);
    color: var(--color-foreground);
    font-size: var(--type-h2-size);
    font-weight: var(--type-h2-weight);
    line-height: var(--type-h2-line);
  }

  .preview :global(h3) {
    color: var(--color-foreground);
    font-size: var(--type-h3-size);
    font-weight: var(--type-h3-weight);
    line-height: var(--type-h3-line);
  }

  .preview :global(h4) {
    color: var(--color-foreground);
    font-size: var(--type-h4-size);
    font-weight: var(--type-h4-weight);
    line-height: var(--type-h4-line);
  }

  .preview :global(ul),
  .preview :global(ol) {
    padding-left: var(--spacing-xl);
  }

  /* 본문 속 링크는 4.5:1 대비를 위해 primary 대신 weak-foreground + 밑줄 */
  .preview :global(a) {
    color: var(--color-weak-foreground);
    text-underline-offset: 3px;
  }

  .preview :global(a:hover) {
    color: var(--color-primary-hover);
  }

  .preview :global(code) {
    padding: 2px var(--spacing-xs);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-foreground);
    font-family: var(--font-mono);
    font-size: var(--type-code-size);
  }

  .preview :global(pre) {
    padding: var(--spacing-lg);
    overflow-x: auto;
    border-radius: var(--radius-md);
    background: var(--color-surface);
    line-height: var(--type-code-line);
  }

  .preview :global(pre code) {
    padding: 0;
    background: none;
  }

  .preview :global(blockquote) {
    padding-left: var(--spacing-lg);
    border-left: 3px solid var(--color-border);
  }

  .preview :global(strong) {
    color: var(--color-foreground);
    font-weight: 700;
  }

  /* 취소선도 본문이므로 muted로 흐리게 하지 않고 4.5:1을 유지한다 */
  .preview :global(s),
  .preview :global(del) {
    color: var(--color-body);
  }

  /* DESIGN.md에 h5/h6 역할이 없어 body / body-small 역할을 굵게 재사용한다 */
  .preview :global(h5) {
    color: var(--color-foreground);
    font-size: var(--type-body-size);
    font-weight: 600;
    line-height: var(--type-body-line);
  }

  .preview :global(h6) {
    color: var(--color-foreground);
    font-size: var(--type-body-small-size);
    font-weight: 600;
    line-height: var(--type-body-small-line);
  }

  .preview :global(hr) {
    border: 0;
    border-top: 1px solid var(--color-border);
  }

  .preview :global(.table-scroll) {
    max-width: 100%;
    overflow-x: auto;
  }

  .preview :global(table) {
    border-collapse: collapse;
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
  }

  .preview :global(th),
  .preview :global(td) {
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--color-border);
    text-align: left;
    /* .preview의 overflow-wrap: anywhere가 열을 한 글자 폭까지 줄이므로, 표에서는 어절 단위로만 줄바꿈하고 넘치면 가로 스크롤한다 */
    overflow-wrap: normal;
    word-break: keep-all;
  }

  .preview :global(th) {
    background: var(--color-surface);
    color: var(--color-foreground);
    font-weight: 600;
  }

  .preview :global(li.task) {
    list-style: none;
  }

  .preview :global(li.task input) {
    margin: 0 var(--spacing-md) 0 0;
    accent-color: var(--color-primary);
    vertical-align: -2px;
  }

  /* inline-block이라 위의 * + * 문단 간격이 걸리지 않게 여백을 지운다 */
  .preview :global(.image-alt) {
    display: inline-block;
    margin: 0;
    padding: 0 var(--spacing-sm);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-body);
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
  }

  /* 1024px 미만: 편집/미리보기 탭 (design.md D7) */
  @media (max-width: 1023px) {
    .tabs {
      display: flex;
    }

    .panes {
      grid-template-columns: 1fr;
    }

    .source-pane {
      border-right: none;
    }

    .panes[data-tab='edit'] .preview,
    .panes[data-tab='preview'] .source-pane {
      display: none;
    }
  }

  @media (max-width: 767px) {
    .back {
      display: grid;
    }

    .preview,
    .source {
      padding: var(--spacing-lg);
    }
  }
</style>
