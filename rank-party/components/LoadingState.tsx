type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <p className="text-lg font-medium text-white drop-shadow-sm">{message}</p>
  );
}
