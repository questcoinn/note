<script lang="ts">
  import { tick, untrack } from 'svelte'
  import { validateFolderName, type FolderNameError } from '../folders.svelte'
  import Icon from './Icon.svelte'
  import PrimaryButton from './PrimaryButton.svelte'

  let {
    open = $bindable(false),
    title,
    confirmLabel,
    initialName = '',
    exceptId,
    onsave,
    onclosed,
  }: {
    open?: boolean
    title: string
    confirmLabel: string
    initialName?: string
    // 이름 바꾸기에서 자기 자신의 현재 이름을 중복으로 보지 않게 한다
    exceptId?: string
    // 저장에 실패하면 reject한다. 성공하면 다이얼로그를 닫는 것은 부른 쪽이다
    onsave: (name: string) => Promise<void>
    // 닫힌 뒤 포커스를 옮기는 데 쓴다. 브라우저의 포커스 복원은 연 버튼이 포커스를 받지 않았으면(Safari 클릭 등) 동작하지 않는다
    onclosed?: () => void
  } = $props()

  const ruleMessages: Record<FolderNameError, string> = {
    empty: '폴더 이름을 입력해 주세요.',
    duplicate: '같은 이름의 폴더가 있어요.',
    reserved: '이 이름은 쓸 수 없어요.',
  }

  let dialog: HTMLDialogElement
  let input: HTMLInputElement
  const id = $props.id()
  let name = $state('')
  let ruleError: FolderNameError | null = $state(null)
  let saveFailed = $state(false)
  let saving = false
  let wasOpen = false

  // showModal()이 포커스 가두기·Esc 닫기·배경 비활성화를 맡는다. 열 때마다 입력과 오류를 초기화한다.
  // 닫힘은 close 이벤트가 아니라 open이 false가 되는 순간으로 알린다. close 이벤트는 창에 포커스가 없으면 늦거나 오지 않을 수 있다
  $effect(() => {
    if (open && !dialog.open) {
      name = initialName
      ruleError = null
      saveFailed = false
      dialog.showModal()
      void tick().then(() => input.select())
    }
    if (!open && dialog.open) dialog.close()
    if (wasOpen && !open) untrack(() => onclosed?.())
    wasOpen = open
  })

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault()
    if (saving) return
    ruleError = validateFolderName(name, exceptId)
    if (ruleError) {
      input.focus()
      return
    }
    saving = true
    saveFailed = false
    try {
      await onsave(name)
    } catch {
      saveFailed = true
    } finally {
      saving = false
    }
  }
</script>

<dialog bind:this={dialog} class="folder-name-dialog" aria-labelledby="{id}-title"
  oncancel={() => (open = false)}
  onclose={() => (open = false)}
>
  <form {onsubmit} novalidate>
    <h2 id="{id}-title" class="title">{title}</h2>
    <div class="field">
      <label for="{id}-input" class="label">폴더 이름</label>
      <input
        bind:this={input}
        bind:value={name}
        id="{id}-input"
        class="text-field"
        class:error={ruleError}
        type="text"
        autocomplete="off"
        aria-invalid={ruleError ? 'true' : undefined}
        aria-describedby={ruleError ? `${id}-rule` : undefined}
        oninput={() => (ruleError = null)}
      />
      {#if ruleError}
        <p id="{id}-rule" class="message">{ruleMessages[ruleError]}</p>
      {/if}
    </div>
    <!-- 영역은 늘 두고 내용만 바꿔야 스크린 리더가 새 문구를 알린다 -->
    <div class="save-error" class:shown={saveFailed} role="alert">
      {#if saveFailed}<Icon name="alert" /><span>폴더를 저장하지 못했어요. 다시 시도해 주세요.</span>{/if}
    </div>
    <div class="actions">
      <button type="button" class="cancel" onclick={() => (open = false)}>취소</button>
      <PrimaryButton type="submit">{confirmLabel}</PrimaryButton>
    </div>
  </form>
</dialog>

<style>
  .folder-name-dialog {
    width: min(400px, calc(100vw - 2 * var(--spacing-lg)));
    padding: var(--spacing-xl);
    border: none;
    border-radius: var(--radius-card);
    background: var(--color-canvas);
    color: var(--color-body);
  }

  .folder-name-dialog::backdrop {
    background: color-mix(in srgb, var(--color-foreground) 50%, transparent);
  }

  .title {
    color: var(--color-foreground);
    font-size: var(--type-h4-size);
    font-weight: var(--type-h4-weight);
    line-height: var(--type-h4-line);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-lg);
  }

  .label {
    color: var(--color-foreground);
    font-size: var(--type-body-small-size);
    font-weight: var(--type-body-small-weight);
    line-height: var(--type-body-small-line);
  }

  .text-field {
    width: 100%;
    min-height: 48px;
    padding: 0 var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-canvas);
    color: var(--color-foreground);
    transition: border-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .text-field:hover {
    border-color: var(--color-muted);
  }

  .text-field.error {
    border-color: var(--color-danger);
  }

  .message {
    color: var(--color-danger);
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
  }

  .save-error {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    color: var(--color-danger);
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
  }

  .save-error.shown {
    margin-top: var(--spacing-lg);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--spacing-md);
    margin-top: var(--spacing-xl);
  }

  .actions > :global(*) {
    flex: 1 1 120px;
  }

  /* 2차 행동 — ConfirmDialog와 같은 모양 */
  .cancel {
    min-height: 56px;
    padding: 0 var(--spacing-xl);
    border: none;
    border-radius: var(--radius-button-xl);
    background: var(--color-surface);
    color: var(--color-foreground);
    font-size: 17px;
    font-weight: 600;
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .cancel:hover {
    background: var(--color-border);
  }
</style>
