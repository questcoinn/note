<script lang="ts">
  import type { Snippet } from 'svelte'
  import Icon, { type IconName } from './Icon.svelte'

  let {
    icon,
    title,
    description,
    action,
  }: {
    icon: IconName
    title: string
    description?: string
    action?: Snippet
  } = $props()
</script>

<div class="empty-state">
  <span class="icon"><Icon name={icon} size={32} /></span>
  <p class="title">{title}</p>
  {#if description}<p class="description">{description}</p>{/if}
  {#if action}<div class="action">{@render action()}</div>{/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    max-width: 320px;
    margin: 0 auto;
    padding: var(--spacing-xxl) var(--spacing-lg);
    text-align: center;
  }

  .icon {
    color: var(--color-muted);
  }

  .title {
    color: var(--color-foreground);
    font-weight: 600;
  }

  .description {
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
  }

  .action {
    margin-top: var(--spacing-md);
  }
</style>
