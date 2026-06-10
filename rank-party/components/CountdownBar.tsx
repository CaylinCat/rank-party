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
      <p className="text-lg font-medium tabular-nums">{secondsLeft}s</p>
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
        <div
          className="h-full bg-black transition-all duration-1000 ease-linear"
          style={{ width: `${(secondsLeft / duration) * 100}%` }}
        />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
    </>
  );
}
