import { useParams } from "next/navigation";

export function useLobbyCode() {
  const params = useParams();
  return (params.code as string).toUpperCase();
}
