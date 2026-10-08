// 서식 결과(Edit)를 원문 textarea에 반영한다. 원문을 바꾸는 브라우저 API는 이 파일에만 둔다 (add-markdown-formatting design.md D2)
//
// document.execCommand('insertText' | 'delete')를 쓰는 이유: textarea에 값을 직접 넣으면(value, setRangeText)
// 브라우저의 되돌리기 기록이 끊긴다. 기록에 남는 프로그램 편집은 지금 이것뿐이다. deprecated 표시가 있지만
// 지원 대상 브라우저의 textarea에서 모두 동작하고 대체 API가 없다.
// 교체할 때: 이 파일만 다시 쓴다. Edit({ from, to, insert })는 CodeMirror 같은 에디터의 변경 단위와 모양이 같다.
//
// 어느 경로든 input 이벤트가 일어나 bind:value와 oninput(markEdited)이 사용자 입력과 똑같이 반영한다.
// 그래서 여기서는 note.source를 바꾸거나 markEdited를 부르지 않는다.

import type { Edit } from './format'

export function applyEdit(textarea: HTMLTextAreaElement, edit: Edit) {
  textarea.focus()
  if (edit.from !== edit.to || edit.insert !== '') {
    textarea.setSelectionRange(edit.from, edit.to)
    // execCommand는 포커스가 있는 요소에 작용한다. 원문이 포커스를 받지 못했으면(숨겨진 경우 등) 다른 입력을 건드리지 않게 대체 경로로 간다
    const focused = document.activeElement === textarea
    if (!focused || !execEdit(edit)) fallbackEdit(textarea, edit)
  }
  textarea.setSelectionRange(edit.selStart, edit.selEnd)
}

function execEdit(edit: Edit): boolean {
  if (typeof document.execCommand !== 'function') return false
  try {
    // insertText에 빈 문자열을 넘기면 브라우저마다 다르게 동작해서 지우기는 delete로 나눈다
    return edit.insert === ''
      ? document.execCommand('delete', false)
      : document.execCommand('insertText', false, edit.insert)
  } catch {
    return false
  }
}

// 되돌리기 기록만 잃고 원문, 미리보기, 저장은 그대로 반영된다
function fallbackEdit(textarea: HTMLTextAreaElement, edit: Edit) {
  textarea.setRangeText(edit.insert, edit.from, edit.to)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
}
