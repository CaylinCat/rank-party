type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <div
      className={`h-screen flex items-center justify-center bg-gray-50 ${className}`}
    >
      {children}
    </div>
  );
}
