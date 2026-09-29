<script lang="ts">
  import Icon from './Icon.svelte'

  let {
    folderName,
    onrename,
    ondelete,
    trigger = $bindable(),
  }: {
    folderName: string
    onrename: () => void
    ondelete: () => void
    // 이름 바꾸기 다이얼로그를 닫은 뒤 포커스를 돌려받는 버튼
    trigger?: HTMLButtonElement
  } = $props()

  const menuId = $props.id()
  let menu: HTMLDivElement
  let open = $state(false)

  // 메뉴 버튼과 메뉴 사이 간격 (--spacing-xs)
  const GAP = 4

  function items(): HTMLButtonElement[] {
    return [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
  }

  // anchor positioning을 쓰지 않고 메뉴 버튼 기준으로 직접 놓는다 (design.md D7).
  // 열기 직전에는 아래에 두고, 열린 뒤 크기를 재서 아래 공간이 모자라면 위로 옮긴다
  function onbeforetoggle(event: ToggleEvent) {
    if (event.newState !== 'open') return
    const rect = trigger!.getBoundingClientRect()
    menu.style.top = `${rect.bottom + GAP}px`
    menu.style.right = `${window.innerWidth - rect.right}px`
  }

  // 위치를 한 번만 계산하므로 사이드바가 스크롤되거나 창 크기가 바뀌면 메뉴 버튼과 어긋나지 않게 닫는다
  $effect(() => {
    if (!open) return
    const onmove = (event: Event) => {
      if (event.type === 'scroll' && menu.contains(event.target as Node)) return
      close()
    }
    window.addEventListener('resize', onmove)
    document.addEventListener('scroll', onmove, true)
    return () => {
      window.removeEventListener('resize', onmove)
      document.removeEventListener('scroll', onmove, true)
    }
  })

  function ontoggle(event: ToggleEvent) {
    open = event.newState === 'open'
    if (!open) return
    const rect = trigger!.getBoundingClientRect()
    const height = menu.offsetHeight
    if (rect.bottom + GAP + height > window.innerHeight && rect.top - GAP - height >= 0) {
      menu.style.top = `${rect.top - GAP - height}px`
    }
    items()[0]?.focus()
  }

  // 메뉴 안에 포커스가 있었으면 메뉴 버튼으로 돌려준다. 브라우저의 복원은 창에 포커스가 없으면 동작하지 않을 수 있다
  function close() {
    const hadFocus = menu.contains(document.activeElement)
    menu.hidePopover()
    if (hadFocus) trigger?.focus()
  }

  function onkeydown(event: KeyboardEvent) {
    const list = items()
    const index = list.indexOf(document.activeElement as HTMLButtonElement)
    const move = (next: number) => {
      event.preventDefault()
      list[(next + list.length) % list.length]?.focus()
    }
    if (event.key === 'ArrowDown') move(index + 1)
    else if (event.key === 'ArrowUp') move(index - 1)
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(list.length - 1)
    else if (event.key === 'Tab') close()
  }

  function choose(action: () => void) {
    close()
    action()
  }
</script>

<button
  bind:this={trigger}
  type="button"
  class="trigger"
  class:open
  aria-label="{folderName} 폴더 메뉴"
  aria-haspopup="menu"
  aria-expanded={open}
  popovertarget={menuId}
>
  <Icon name="more-horizontal" />
</button>

<div
  bind:this={menu}
  id={menuId}
  class="menu"
  popover="auto"
  role="menu"
  tabindex="-1"
  aria-label="{folderName} 폴더"
  {onbeforetoggle}
  {ontoggle}
  {onkeydown}
>
  <button type="button" role="menuitem" tabindex="-1" class="item" onclick={() => choose(onrename)}>이름 바꾸기</button>
  <button type="button" role="menuitem" tabindex="-1" class="item danger" onclick={() => choose(ondelete)}>삭제</button>
</div>

<style>
  .trigger {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: inherit;
  }

  /* weak-background는 선택 상태 색이라 hover에는 쓰지 않는다. 사이드바의 다른 아이콘 버튼과 같은 색 */
  .trigger:hover,
  .trigger.open {
    background: var(--color-border);
  }

  /* 그림자 없이 경계선으로만 캔버스와 구분한다 (DESIGN.md folder-menu) */
  .menu {
    position: fixed;
    inset: auto;
    min-width: 140px;
    margin: 0;
    padding: var(--spacing-xs);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-canvas);
    color: var(--color-body);
  }

  .item {
    display: block;
    width: 100%;
    min-height: 40px;
    padding: 0 var(--spacing-md);
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    font-weight: 400;
    text-align: left;
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .item:hover,
  .item:focus-visible {
    background: var(--color-surface);
  }

  /* danger는 흰 배경에서 4.82:1이지만 surface 배경에서는 4.37:1이라, 배경을 바꾸지 않고 밑줄로 hover를 보인다 */
  .danger {
    color: var(--color-danger);
  }

  .danger:hover,
  .danger:focus-visible {
    background: transparent;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
</style>
