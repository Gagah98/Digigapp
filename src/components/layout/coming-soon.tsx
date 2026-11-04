export function ComingSoon({ title, phase, children }: { title: string; phase: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Prévu en {phase} de la roadmap.</p>
      {children && <div className="mt-6 text-sm leading-relaxed">{children}</div>}
    </div>
  );
}
