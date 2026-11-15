/**
 * 글자가 여러 요소로 나뉜 곳(숫자 올라가기 `CountUp`가 값만 감싼 줄)을 전체 글자로 찾는 맞춤 함수.
 * 화면 낭독기와 같이 `aria-hidden` 아래 글자는 빼고 읽는다(`CountUp`은 움직이는 글자를 숨기고 최종 글자를 `sr-only`로 둔다).
 * 그 글자를 온전히 담은 가장 안쪽 요소 하나만 맞는다(바깥 조상까지 겹쳐 잡지 않게).
 */
function readable(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node instanceof Element && node.getAttribute("aria-hidden") === "true") return "";
  return Array.from(node.childNodes).map(readable).join("");
}

export function fullText(match: string | RegExp) {
  const test = (text: string) => (typeof match === "string" ? text === match : match.test(text));
  return (_content: string, element: Element | null): boolean => {
    if (element === null || !test(readable(element))) return false;
    return !Array.from(element.children).some((child) => test(readable(child)));
  };
}
