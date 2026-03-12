export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="glass rounded-2xl border-dashed p-10 text-center">
      <p className="theme-text-main text-base font-semibold">{title}</p>
      {description ? <p className="theme-text-muted mt-2 text-sm">{description}</p> : null}
    </div>
  );
}
