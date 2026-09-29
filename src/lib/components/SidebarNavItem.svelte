<script lang="ts">
  import type { Snippet } from 'svelte'
  import Icon from './Icon.svelte'

  let {
    variant,
    label,
    count,
    active = false,
    onclick,
    menu,
    button = $bindable(),
  }: {
    variant: 'folder' | 'all-notes' | 'unfiled'
    label: string
    count: number
    active?: boolean
    onclick: () => void
    // 폴더 항목 뒤의 메뉴 버튼. 버튼 안에 버튼을 넣을 수 없어 형제로 둔다 (design.md D7)
    menu?: Snippet
    // 폴더를 만든 뒤 포커스를 옮길 수 있게 밖으로 내보낸다
    button?: HTMLButtonElement
  } = $props()

  const iconName = $derived(
    variant === 'folder' ? 'folder' : variant === 'unfiled' ? 'inbox' : 'file-text',
  )
</script>

<div class="sidebar-nav-item" class:active>
  <button
    bind:this={button}
    type="button"
    class="hit"
    aria-current={active ? 'page' : undefined}
    {onclick}
  >
    <Icon name={iconName} />
    <span class="label">{label}</span>
    <span class="count" aria-label="노트 {count}개">{count}</span>
  </button>
  {#if menu}{@render menu()}{/if}
</div>

<style>
  .sidebar-nav-item {
    display: flex;
    align-items: center;
    border-radius: var(--radius-md);
    color: var(--color-body);
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .sidebar-nav-item:hover {
    background: var(--color-border);
  }

  /* 메뉴 버튼이 붙은 행에서도 링이 가려지지 않게 행 전체에 그린다 (NoteCard와 같은 방식) */
  .sidebar-nav-item:has(.hit:focus-visible) {
    box-shadow: var(--focus-ring);
  }

  .hit:focus-visible {
    box-shadow: none;
  }

  .sidebar-nav-item.active {
    background: var(--color-weak-background);
    color: var(--color-weak-foreground);
    font-weight: 600;
  }

  .hit {
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--spacing-md);
    min-width: 0;
    min-height: 40px;
    padding: 0 var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: inherit;
    font-weight: inherit;
    text-align: left;
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    font-size: var(--type-body-small-size);
    font-variant-numeric: tabular-nums;
  }
</style>
