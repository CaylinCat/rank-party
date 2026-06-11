import { PartyShell } from "@/components/shell/PartyShell";
import { TitleHero } from "@/components/marketing/TitleHero";
import { CreateLobbyForm } from "@/components/marketing/CreateLobbyForm";

export default function Home() {
  return (
    <PartyShell>
      <TitleHero />
      <CreateLobbyForm />
    </PartyShell>
  );
}
