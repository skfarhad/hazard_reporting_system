import React, { Fragment } from "react";
export type TDataTableColumn = {
  title: string;
  width?: string;
  selector: string;
  hidden?: boolean;
  type?: "action" | "number";
  cell?: (col: Record<string, string | number>, index: number) => void;
};
type TProps = {
  columns: TDataTableColumn[];
  data: Record<string, string | number | boolean>[];
  loading: boolean;
};
export default function DataTable({ columns, loading = false, data }: TProps) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((itm: any) => {
            return (
              <th
                key={itm.title}
                style={{ width: `${itm.width ? itm.width : "40px"}` }}
              >
                {itm.title}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr style={{ height: "30vh" }}>
            <td colSpan={columns.length}>loading...</td>
          </tr>
        ) : (
          data?.map((column: any, index: number) => (
            <tr key={index + 1}>
              {columns.map((c: any, indx: number) => (
                <Fragment key={indx + 1}>
                  <td
                    hidden={c?.hidden ?? false}
                    id={`${indx}`}
                    style={{
                      textAlign:
                        c.type === "action"
                          ? "center"
                          : c.type === "number"
                          ? "right"
                          : "left",
                    }}
                  >
                    {c?.cell ? c.cell(column, index) : column[c?.selector]}
                  </td>
                </Fragment>
              ))}
            </tr>
          ))
        )}
        <tr hidden={!!data?.length} className="no-data-row">
          <td colSpan={columns.length}>There are no records to display</td>
        </tr>
      </tbody>
    </table>
  );
}
