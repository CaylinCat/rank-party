import { PartyShell } from "@/components/shell/PartyShell";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

/** @deprecated Use PartyShell directly */
export function PageShell({ children, className = "" }: PageShellProps) {
  return <PartyShell className={className}>{children}</PartyShell>;
}
