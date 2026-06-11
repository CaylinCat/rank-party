import { cn } from "@/lib/utils";

type PartyCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function PartyCard({ children, className }: PartyCardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
