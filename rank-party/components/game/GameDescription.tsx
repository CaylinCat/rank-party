type GameDescriptionProps = {
  description?: string | null;
};

export function GameDescription({ description }: GameDescriptionProps) {
  const text = description?.trim();
  if (!text) return null;

  return (
    <p className="mx-auto mb-4 max-w-lg text-center text-lg font-semibold leading-snug text-white drop-shadow-md">
      {text}
    </p>
  );
}
