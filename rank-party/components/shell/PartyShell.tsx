import { PartyBackground } from "@/components/marketing/PartyBackground";
import { cn } from "@/lib/utils";

type PartyShellProps = {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
};

export function PartyShell({
  children,
  className = "",
  fullHeight = false,
}: PartyShellProps) {
  return (
    <div
      className={cn(
        "party-gradient-bg relative flex min-h-screen w-full flex-col items-center px-4 py-8",
        !fullHeight && "justify-center",
        className
      )}
    >
      <PartyBackground />
      <div
        className={cn(
          "relative z-10 w-full max-w-5xl",
          fullHeight && "flex min-h-[calc(100vh-4rem)] flex-col justify-center"
        )}
      >
        {children}
      </div>
    </div>
  );
}
