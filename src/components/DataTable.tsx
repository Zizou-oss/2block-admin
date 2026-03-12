import type { ReactNode } from "react";

export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="theme-table-head">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-semibold tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="theme-table-body divide-y divide-white/8">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
