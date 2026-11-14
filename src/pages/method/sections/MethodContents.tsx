import { MethodToc } from "../../../components/method/MethodToc";
import { useActiveSection } from "../../../hooks/useActiveSection";
import { useMethodMessages } from "../../../i18n/method";
import { DataSection } from "./DataSection";
import { QuestionSection } from "./QuestionSection";

/*
 * 기법 페이지 본문: 왼쪽 목차 + 오른쪽 절. 목차의 "지금 보는 절" 추적을 여기서 맡는다(페이지는 배치만).
 * 절 목록은 이 표 한 곳에만 둔다: 해시 이름(두 언어 공용, `plans/method-page.md` 8-2), 목차 번호·이름, 그릴 구역.
 * 절은 사용자와 글을 합의한 순서대로 하나씩 더한다(12-4).
 */
const SECTIONS = [
  { id: "question", key: "question", Body: QuestionSection },
  { id: "data", key: "data", Body: DataSection },
] as const;

const SECTION_IDS = SECTIONS.map((section) => section.id);

export function MethodContents() {
  const t = useMethodMessages();
  const { track, active } = useActiveSection(SECTION_IDS);
  const toc = SECTIONS.map(({ id, key }) => ({ id, index: t[key].index, label: t[key].toc }));

  return (
    <div className="grid grid-cols-[13.75rem_minmax(0,1fr)] gap-18 pt-10">
      <MethodToc label={t.tocLabel} items={toc} active={active} />
      <div ref={track} className="min-w-0">
        {SECTIONS.map(({ id, Body }) => (
          <Body key={id} id={id} />
        ))}
      </div>
    </div>
  );
}
