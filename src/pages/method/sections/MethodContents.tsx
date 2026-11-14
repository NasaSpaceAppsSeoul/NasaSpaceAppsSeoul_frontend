import type { ReactNode } from "react";
import { MethodToc, type TocBack } from "../../../components/method/MethodToc";
import { useActiveSection } from "../../../hooks/useActiveSection";
import { useMethodMessages } from "../../../i18n/method";
import { BuiltSection } from "./BuiltSection";
import { CellSection } from "./CellSection";
import { ChipSection } from "./ChipSection";
import { DataSection } from "./DataSection";
import { HarmonizeSection } from "./HarmonizeSection";
import { IndicatorsSection } from "./IndicatorsSection";
import { LimitsSection } from "./LimitsSection";
import { QuestionSection } from "./QuestionSection";
import { SparseSection } from "./SparseSection";
import { ValidateSection } from "./ValidateSection";

/*
 * 기법 페이지 본문: 왼쪽 목차 + 오른쪽 절. 목차의 "지금 보는 절" 추적을 여기서 맡는다(페이지는 배치만).
 * 절 목록은 이 표 한 곳에만 둔다: 해시 이름(두 언어 공용, `plans/method-page.md` 8-2), 목차 번호·이름, 그릴 구역.
 * 절은 사용자와 글을 합의한 순서대로 더했다(12-4). 해시 이름은 8-2 목록과 같다.
 * 글자 크기·자간·폭의 임의 값(`text-[0.8125rem]` 등)은 시안 `method_page.html` CSS의 px 값을 rem으로 옮긴 것이다(토큰에 같은 크기가 없음).
 */
const SECTIONS = [
  { id: "question", key: "question", Body: QuestionSection },
  { id: "data", key: "data", Body: DataSection },
  { id: "cell", key: "cell", Body: CellSection },
  { id: "harmonize", key: "harmonize", Body: HarmonizeSection },
  { id: "validate", key: "validate", Body: ValidateSection },
  { id: "chip", key: "chip", Body: ChipSection },
  { id: "sparse", key: "sparse", Body: SparseSection },
  { id: "indicators", key: "indicators", Body: IndicatorsSection },
  { id: "limits", key: "limits", Body: LimitsSection },
  { id: "built", key: "built", Body: BuiltSection },
] as const;

const SECTION_IDS = SECTIONS.map((section) => section.id);

/** `end`: 오른쪽 칸 맨 아래 끝 줄, `back`: 목차 위 돌아가기 링크(둘 다 페이지가 주소를 만들어 넘긴다) */
export function MethodContents({ end, back }: { end: ReactNode; back: TocBack }) {
  const t = useMethodMessages();
  const { track, active } = useActiveSection(SECTION_IDS);
  const toc = SECTIONS.map(({ id, key }) => ({ id, index: t[key].index, label: t[key].toc }));

  return (
    <div className="grid grid-cols-[13.75rem_minmax(0,1fr)] gap-18 pt-10">
      <MethodToc label={t.tocLabel} items={toc} active={active} back={back} />
      <div ref={track} className="min-w-0">
        {SECTIONS.map(({ id, Body }) => (
          <Body key={id} id={id} />
        ))}
        {end}
      </div>
    </div>
  );
}
