<script lang="ts">
  let {
    label,
    variant = 'weak',
    selected = false,
  }: {
    label: string
    variant?: 'fill' | 'weak'
    selected?: boolean
  } = $props()
</script>

<!-- 뼈대 단계: 누르면 태그 필터가 될 자리. 지금은 시각 상태만 있다. -->
<button type="button" class="tag-chip {variant}" class:selected aria-pressed={selected}>
  #{label}
</button>

<style>
  .tag-chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 var(--spacing-md);
    border: none;
    border-radius: var(--radius-sm);
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
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

  .weak {
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
</style>
