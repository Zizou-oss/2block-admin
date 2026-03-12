export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (nextPage: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="theme-button-secondary rounded-xl px-3 py-1 text-sm disabled:opacity-50"
      >
        Prec
      </button>
      <span className="theme-text-muted text-sm">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="theme-button-secondary rounded-xl px-3 py-1 text-sm disabled:opacity-50"
      >
        Suiv
      </button>
    </div>
  );
}
