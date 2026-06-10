type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return <p className="text-red-600">{message}</p>;
}
