import { calendarLayout, IMAGE, type ImageDot } from "../../lib/calendarImage";
import type { Basis, HeatLevel, HeatRow } from "../../lib/heatmap";

/*
 * 달력 PNG 그리기(9장). 배치는 `lib/calendarImage`, 색은 화면 달력과 같은 `styles/index.css` 토큰을 읽는다
 * (점 단계 0~4 → heat-0·2·4·5·7, 보정 전은 heat-0·raw-2·raw-4·raw-5·raw-7, `HeatmapCell` `LEVEL_CLASS`와 같음).
 * 지금 화면에 보이는 쪽(보정 전/후)을 그린다. 화면 장식(유리·배경 그림)은 넣지 않고 어두운 바탕 한 색.
 * 선택한 달 고리는 그리지 않는다(파일은 자료 자체를 담는다). 글자는 부르는 쪽이 지금 언어로 만들어 넘긴다.
 */
export type CalendarImageText = {
  title: string;
  sub: string;
  monthLabel: (m: number) => string;
  legendTitle: string;
  /** 단계 0~4 견본 이름 */
  levels: { level: HeatLevel; label: string }[];
  /** `converted`가 `null`이면(보정 전) 환산 견본을 그리지 않는다 */
  states: { noData: string; partial: string; converted: string | null; future: string };
  /** 출처·자료 기준일 줄과 비교 기간·색 구간 줄 */
  source: string;
  period: string;
};

const LEVEL_TOKEN: Record<Basis, Record<HeatLevel, [string, string]>> = {
  harmonized: { 0: ["heat-0", "#dfe2e5"], 1: ["heat-2", "#e5c59f"], 2: ["heat-4", "#d39a5e"], 3: ["heat-5", "#ca8547"], 4: ["heat-7", "#ae5b2b"] },
  raw: { 0: ["heat-0", "#dfe2e5"], 1: ["heat-raw-2", "#accde4"], 2: ["heat-raw-4", "#76a7cc"], 3: ["heat-raw-5", "#6095bf"], 4: ["heat-raw-7", "#3972a4"] },
};
/** 화면 `--font-sans`와 같은 순서(영문·숫자는 Plex Sans, 한글은 Plex Sans KR) */
const FONT = '"IBM Plex Sans", "IBM Plex Sans KR", system-ui, sans-serif';
const SCALE = 2;

function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim() || fallback;
}

type Colors = {
  bg: string; ink: string; muted: string; line: string; border: string;
  levels: Record<HeatLevel, string>; hatch: string; dot: string; partialRing: string; future: string;
};

function readColors(basis: Basis): Colors {
  const level = (l: HeatLevel) => token(...LEVEL_TOKEN[basis][l]);
  return {
    bg: token("surface", "#111113"),
    ink: token("ink", "#f4f4f1"),
    muted: token("muted", "#929398"),
    line: "rgba(255,255,255,0.14)",
    border: token("border", "#2a2a2d"),
    levels: { 0: level(0), 1: level(1), 2: level(2), 3: level(3), 4: level(4) },
    hatch: token("heat-hatch", "#7d7d81"),
    dot: token("heat-dot", "rgba(8,9,11,0.27)"),
    partialRing: token("heat-partial-ring", "#e99a60"),
    future: token("heat-future", "#737d89"),
  };
}

type DotKind = "value" | "noData" | "partial" | "future";

/** 점 하나: 화면 달력 칸 상태와 같은 모양(빈칸은 그리지 않음) */
function drawDot(ctx: CanvasRenderingContext2D, c: Colors, x: number, y: number, kind: DotKind, level: HeatLevel, converted = false) {
  const r = IMAGE.dotRadius;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (kind === "future") {
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = c.future;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (kind === "noData") {
    ctx.fillStyle = c.border;
    ctx.fill();
    ctx.clip();
    ctx.strokeStyle = c.hatch;
    ctx.lineWidth = 1;
    for (let d = -2 * r; d <= 2 * r; d += 5) {
      ctx.beginPath();
      ctx.moveTo(x + d - r, y + r);
      ctx.lineTo(x + d + r, y - r);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  ctx.fillStyle = c.levels[level];
  ctx.fill();
  // 센서 환산값 점무늬는 상태와 상관없이(화면 `HeatmapCell`과 같이 집계 중 칸에도)
  if (converted) {
    ctx.clip();
    ctx.fillStyle = c.dot;
    for (let dx = -r; dx <= r; dx += 4) {
      for (let dy = -r; dy <= r; dy += 4) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  if (kind === "partial") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = c.partialRing;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

/** 화면 칸 상태 → 그림 모양. 빈칸(시계열 첫 달 앞)은 그리지 않는다 */
export function dotKind(dot: Pick<ImageDot, "cell">): DotKind | null {
  const { state } = dot.cell;
  if (state === "blank") return null;
  if (state === "future") return "future";
  if (state === "noData") return "noData";
  if (state === "partial") return "partial";
  return "value";
}

/** 그린 그림을 PNG `Blob`으로. 격자가 비었거나 캔버스를 만들 수 없으면 에러 */
export async function renderCalendarPng(rows: readonly HeatRow[], text: CalendarImageText, basis: Basis): Promise<Blob> {
  const layout = calendarLayout(rows);
  if (layout === null) throw new Error("빈 달력");
  // 웹 글꼴이 다 불러와진 뒤에 그려야 글자가 대체 글꼴로 바뀌지 않는다
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  // 긴 제목(영문·긴 지역 이름)이 잘리지 않게 글자 폭을 재서 그림 폭을 넓힌다
  const probe = canvas.getContext("2d");
  if (probe === null) throw new Error("캔버스를 만들 수 없음");
  probe.font = `500 20px ${FONT}`;
  const titleWidth = probe.measureText(text.title).width;
  probe.font = `400 11px ${FONT}`;
  const lineWidth = Math.max(probe.measureText(text.source).width, probe.measureText(text.period).width);
  layout.width = Math.max(layout.width, Math.ceil(IMAGE.padding * 2 + Math.max(titleWidth, lineWidth)));
  canvas.width = layout.width * SCALE;
  canvas.height = layout.height * SCALE;
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("캔버스를 만들 수 없음");
  ctx.scale(SCALE, SCALE);
  const c = readColors(basis);
  const { padding } = IMAGE;

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, layout.width, layout.height);

  // 제목·부제
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = c.ink;
  ctx.font = `500 20px ${FONT}`;
  ctx.fillText(text.title, padding, padding + 22);
  ctx.fillStyle = c.muted;
  ctx.font = `400 12px ${FONT}`;
  ctx.fillText(text.sub, padding, padding + 46);

  // 해 이름(위), 달 이름(왼쪽)
  ctx.font = `400 10px ${FONT}`;
  ctx.textAlign = "center";
  for (const y of layout.years) ctx.fillText(String(y.year), y.x, layout.gridTop - 10);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const m of layout.months) ctx.fillText(text.monthLabel(m.month), padding, m.y);

  // 센서 전환 세로 점선
  ctx.save();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = c.line;
  for (const d of layout.dividers) {
    ctx.beginPath();
    ctx.moveTo(d.x, layout.gridTop - 4);
    ctx.lineTo(d.x, layout.gridBottom);
    ctx.stroke();
  }
  ctx.restore();

  for (const dot of layout.dots) {
    const kind = dotKind(dot);
    if (kind !== null) drawDot(ctx, c, dot.x, dot.y, kind, dot.cell.level, dot.cell.converted);
  }

  // 범례: 단계 견본 줄, 상태 견본 줄
  let x = padding;
  let y = layout.footerTop + 10;
  ctx.font = `400 11px ${FONT}`;
  ctx.fillStyle = c.muted;
  ctx.fillText(text.legendTitle, x, y);
  x += ctx.measureText(text.legendTitle).width + 20;
  for (const item of text.levels) {
    drawDot(ctx, c, x + IMAGE.dotRadius, y, "value", item.level);
    ctx.fillStyle = c.muted;
    ctx.fillText(item.label, x + IMAGE.dotRadius * 2 + 6, y);
    x += IMAGE.dotRadius * 2 + 6 + ctx.measureText(item.label).width + 18;
  }
  x = padding;
  y += 30;
  const states: [DotKind, boolean, string][] = [
    ...(text.states.converted === null ? [] : [["value", true, text.states.converted] satisfies [DotKind, boolean, string]]),
    ["noData", false, text.states.noData],
    ["partial", false, text.states.partial],
    ["future", false, text.states.future],
  ];
  for (const [kind, converted, label] of states) {
    drawDot(ctx, c, x + IMAGE.dotRadius, y, kind, 2, converted);
    ctx.fillStyle = c.muted;
    ctx.fillText(label, x + IMAGE.dotRadius * 2 + 8, y);
    x += IMAGE.dotRadius * 2 + 8 + ctx.measureText(label).width + 22;
  }

  // 출처·비교 기간
  ctx.font = `400 11px ${FONT}`;
  ctx.fillStyle = c.muted;
  ctx.fillText(text.source, padding, y + 34);
  ctx.fillText(text.period, padding, y + 54);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob === null ? reject(new Error("PNG를 만들지 못함")) : resolve(blob)), "image/png");
  });
}
