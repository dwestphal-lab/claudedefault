"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface PaginatedUsers {
  data: User[];
  total: number;
  limit: number;
  offset: number;
}

export function useUsers({ limit = 20, offset = 0 } = {}) {
  return useQuery({
    queryKey: ["users", { limit, offset }],
    queryFn: () => api.get<PaginatedUsers>(`/users?limit=${limit}&offset=${offset}`),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; name?: string }) =>
      api.post<User>("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Benutzer erstellt");
    },
    onError: (error: any) => {
      toast.error(error.message || "Fehler beim Erstellen");
    },
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<{ status: string; db: string; version: string }>("/health"),
    refetchInterval: 30_000,
  });
}
