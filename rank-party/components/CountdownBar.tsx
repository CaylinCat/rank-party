type CountdownBarProps = {
  secondsLeft: number;
  duration: number;
  label: string;
};

export function CountdownBar({
  secondsLeft,
  duration,
  label,
}: CountdownBarProps) {
  return (
    <>
      <p className="text-lg font-bold tabular-nums text-foreground">
        {secondsLeft}s
      </p>
      <div className="mx-auto h-2 w-64 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${(secondsLeft / duration) * 100}%` }}
        />
      </div>
      {label && (
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      )}
    </>
  );
}
