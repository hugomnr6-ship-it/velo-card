import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface UserQuest {
  id: string;
  quest_id: string;
  quest_definitions: {
    id: string;
    title: string;
    description: string;
    icon: string;
    quest_type: "daily" | "weekly";
    target_value: number;
    target_metric: string;
    coin_reward: number;
  };
  current_value: number;
  is_completed: boolean;
  coin_claimed: boolean;
  assigned_date: string;
}

export function useQuests() {
  return useQuery<UserQuest[]>({
    queryKey: ["quests"],
    queryFn: async () => {
      const res = await fetch("/api/quests");
      if (!res.ok) throw new Error("Erreur quetes");
      return res.json();
    },
  });
}

export function useAssignQuests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Erreur assignation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
    },
  });
}
