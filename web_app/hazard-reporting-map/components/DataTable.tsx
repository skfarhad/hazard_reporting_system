import { cn } from '@/lib/utils';
import { Fragment } from 'react';
export type TDataTableColumn = {
  title?: string;
  width?: string;
  selector?: string;
  hidden?: boolean;
  type?: 'action' | 'number';
  cell?: (col: Record<string, any>, index: number) => void;
  header?: (col: Record<string, any>, index: number) => void;
};
type TProps = {
  columns: TDataTableColumn[];
  data: Record<string, any>[];
  loading: boolean;
};
export default function DataTable({ columns, loading = false, data }: TProps) {
  return (
    <div className="w-full overflow-auto relative">
      <table className="w-full border-collapse bg-card text-card-foreground rounded-md text-xs text-zinc-700 ">
        <thead>
          <tr className="rounded-md">
            {columns.map((itm: any, index: number) => {
              return (
                <th
                  key={itm.title}
                  style={{ width: `${itm.width ? itm.width : '40px'}` }}
                  className={cn(
                    'py-4 px-3 bg-secondary-background text-left font-semibold uppercase',
                    {
                      'text-center': itm.header,
                    }
                  )}
                >
                  {itm.title ? itm.title : itm.header(itm, index)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr style={{ height: '30vh' }}>
              <td className="p-8 text-left" colSpan={columns.length}>
                loading...
              </td>
            </tr>
          ) : (
            data?.map((column: any, index: number) => (
              <tr
                className="hover:bg-gray/50 even:bg-table-header-bg"
                key={index + 1}
              >
                {columns.map((c: any, indx: number) => (
                  <Fragment key={indx + 1}>
                    <td
                      hidden={c?.hidden ?? false}
                      id={`${indx}`}
                      style={{
                        textAlign:
                          c.type === 'action'
                            ? 'center'
                            : c.type === 'number'
                              ? 'right'
                              : 'left',
                      }}
                      className="p-3 text-left"
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
    </div>
  );
}
