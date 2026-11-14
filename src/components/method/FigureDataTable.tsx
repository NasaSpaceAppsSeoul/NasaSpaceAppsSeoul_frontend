/*
 * 그림의 값을 화면 읽기 프로그램에 전하는 숨긴 표. `<svg role="img">` 안의 글자·`<title>`은 읽히지 않으므로
 * 같은 값을 표로 함께 둔다(화면에는 보이지 않는다). 탭을 바꾸면 표도 그 나라 값으로 바뀐다.
 */
type FigureDataTableProps = {
  caption: string;
  head: readonly string[];
  rows: readonly { key: string; cells: readonly string[] }[];
};

export function FigureDataTable({ caption, head, rows }: FigureDataTableProps) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {head.map((title) => (
            <th key={title} scope="col">
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            {row.cells.map((cell, i) =>
              i === 0 ? (
                <th key={head[0] ?? "row"} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={head[i] ?? `col-${i}`}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
