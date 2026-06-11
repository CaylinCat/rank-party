type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <p className="text-center text-sm font-semibold text-destructive">
      {message}
    </p>
  );
}
