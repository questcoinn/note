// 태그 이름 규칙. 태그는 이름으로만 구별하며, 비교는 대소문자를 구분하지 않는다 (design.md D2)

// 앞뒤 공백을 지운 뒤 맨 앞의 #들과 그 뒤 공백을 지운다. 이름 안의 공백은 그대로 둔다
export function normalizeTagInput(raw: string): string {
  return raw.trim().replace(/^#+\s*/, '')
}

export function tagKey(name: string): string {
  return name.toLocaleLowerCase('ko')
}
