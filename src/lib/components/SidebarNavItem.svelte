<script lang="ts">
  import Icon from './Icon.svelte'

  let {
    variant,
    label,
    count,
    active = false,
  }: {
    variant: 'folder' | 'tag' | 'all-notes'
    label: string
    count: number
    active?: boolean
  } = $props()

  const iconName = $derived(variant === 'folder' ? 'folder' : variant === 'tag' ? 'hash' : 'file-text')
</script>

<!-- 뼈대 단계: 누르면 목록 범위를 바꿀 자리. 지금은 시각 상태만 있다. -->
<button type="button" class="sidebar-nav-item" class:active aria-current={active ? 'page' : undefined}>
  <Icon name={iconName} />
  <span class="label">{label}</span>
  <span class="count" aria-label="노트 {count}개">{count}</span>
</button>

<style>
  .sidebar-nav-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    width: 100%;
    min-height: 40px;
    padding: 0 var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-body);
    text-align: left;
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .sidebar-nav-item:hover {
    background: var(--color-border);
  }

  .sidebar-nav-item.active {
    background: var(--color-weak-background);
    color: var(--color-weak-foreground);
    font-weight: 600;
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
