import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type HostItemsInputProps = {
  value: string;
  onChange: (value: string) => void;
  roundCount: number;
  disabled?: boolean;
};

export function HostItemsInput({
  value,
  onChange,
  roundCount,
  disabled,
}: HostItemsInputProps) {
  return (
    <Card className="rounded-3xl border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">Items to rank</CardTitle>
        <p className="text-sm text-muted-foreground">
          {roundCount} comma-separated items (optional — leave blank for
          defaults)
        </p>
      </CardHeader>
      <CardContent>
        <Textarea
          rows={4}
          placeholder="bob, cat, dog, pizza, mondays, react, coffee, summer, AI, chaos"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="rounded-xl resize-none"
        />
      </CardContent>
    </Card>
  );
}
