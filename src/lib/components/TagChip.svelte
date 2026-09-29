<script lang="ts">
  import Icon from './Icon.svelte'

  let {
    label,
    variant = 'weak',
    selected = false,
    onclick,
    onremove,
  }: {
    label: string
    variant?: 'fill' | 'weak' | 'removable'
    selected?: boolean
    // fill·weak: 누르면 이 태그 범위로 간다
    onclick?: () => void
    // removable: x 버튼으로 뗀다
    onremove?: () => void
  } = $props()
</script>

{#if variant === 'removable'}
  <!-- 에디터 태그 줄의 칩. 라벨은 누를 수 없고 x 버튼으로만 뗀다 (design.md D6) -->
  <span class="tag-chip removable">
    <span class="label">#{label}</span>
    <button type="button" class="remove" aria-label="{label} 태그 떼기" onclick={onremove}>
      <Icon name="x" size={14} />
    </button>
  </span>
{:else}
  <!-- 켜고 끄는 토글이 아니라 범위로 가는 탐색 버튼이라, 지금 보는 태그는 aria-current로 알린다 (design.md D5) -->
  <button
    type="button"
    class="tag-chip {variant}"
    class:selected
    aria-current={selected ? 'true' : undefined}
    {onclick}
  >
    #{label}
  </button>
{/if}

<style>
  .tag-chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    max-width: 100%;
    padding: 0 var(--spacing-md);
    border: none;
    border-radius: var(--radius-sm);
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
    text-align: start;
    overflow-wrap: anywhere;
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .fill {
    background: var(--color-surface);
    color: var(--color-body);
  }

  .fill:hover {
    background: var(--color-weak-background);
    color: var(--color-weak-foreground);
  }

  .weak,
  .removable {
    background: var(--color-weak-background);
    color: var(--color-weak-foreground);
  }

  .weak:hover {
    background: color-mix(in srgb, var(--color-weak-background) 80%, var(--color-primary));
  }

  .tag-chip.selected {
    background: var(--color-weak-foreground);
    color: var(--color-canvas);
  }

  .removable {
    gap: var(--spacing-xs);
    padding-right: var(--spacing-xs);
  }

  .label {
    min-width: 0;
  }

  .remove {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: inherit;
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .remove:hover {
    background: color-mix(in srgb, var(--color-weak-background) 80%, var(--color-primary));
  }
</style>
