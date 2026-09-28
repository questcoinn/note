<script lang="ts">
  import type { SaveStatus } from '../ui-state.svelte'
  import Icon, { type IconName } from './Icon.svelte'

  let { status }: { status: SaveStatus } = $props()

  const variants: Record<SaveStatus, { icon: IconName; label: string }> = {
    saved: { icon: 'check', label: '저장됨' },
    saving: { icon: 'loader', label: '저장 중' },
    unsaved: { icon: 'alert', label: '저장 안 됨' },
  }

  const current = $derived(variants[status])
</script>

<p class="save-status {status}" role="status">
  <Icon name={current.icon} size={16} />
  <span>{current.label}</span>
</p>

<style>
  .save-status {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
    white-space: nowrap;
  }

  .saved {
    color: var(--color-success);
  }

  .saving {
    color: var(--color-muted);
  }

  .unsaved {
    color: var(--color-danger);
  }
</style>
