import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { z } from "zod";
import type {
  OpenConquestDto,
  OpenExpeditionDto,
  CaravanReportResponse,
  CombatReportResponse,
  ReinforcementReportResponse,
  ScoutReportResponse,
} from "@battleforthecrown/shared/combat";
import {
  CaravanReportsResponseSchema,
  CaravanReportResponseSchema,
  CombatReportsResponseSchema,
  CombatReportResponseSchema,
  ReinforcementReportsResponseSchema,
  ReinforcementReportResponseSchema,
  ScoutReportsResponseSchema,
  ScoutReportResponseSchema,
} from "@battleforthecrown/shared/combat";
import {
  IncomingAttackDtoSchema,
  type IncomingAttackDto,
} from "@battleforthecrown/shared/events";
import { apiClient } from "../index";
import type {
  Expedition,
  CaravanPayload,
  GarrisonLine,
  RecallReinforcementPayload,
  ReinforcePayload,
} from "@/lib/types";
import { useExpeditionsStore } from "@/stores/expeditions";
import { useAuthStore } from "@/stores/auth";
import { useGameStore } from "@/stores/game";
import { buildRecalledExpeditionPatch } from "@/lib/expeditionRecall";
import { queryKeys } from "./keys";
import {
  invalidateCombatDispatchQueries,
  invalidateTroopMovementQueries,
} from "./helpers";

export interface ActiveExpeditionDto {
  id: string;
  kind?: "ATTACK" | "REINFORCE" | "SCOUT" | "CARAVAN";
  attackerVillageId: string;
  attackerUserId: string;
  defenderVillageId?: string | null;
  defenderUserId?: string | null;
  targetRefId?: string | null;
  reinforcementOriginVillageId?: string | null;
  targetX: number;
  targetY: number;
  targetKind: string;
  departAt: string;
  arrivalAt: string;
  returnAt?: string | null;
  status: string;
  units: Record<string, number>;
  reportId?: string | null;
  recalled?: boolean;
  updatedAt?: string;
}

export function useActiveExpeditionsQuery(villageId: string | null) {
  return useQuery<ActiveExpeditionDto[]>({
    queryKey: queryKeys.activeExpeditions(villageId),
    queryFn: () => {
      if (!villageId) return Promise.resolve([] as ActiveExpeditionDto[]);
      return apiClient.get<ActiveExpeditionDto[]>(
        `/combat/${villageId}/active`,
      );
    },
    enabled: Boolean(villageId),
    refetchInterval: (query) =>
      query.state.data && query.state.data.length > 0 ? 5_000 : false,
    staleTime: 2_000,
  });
}

const IncomingAttackDtoArraySchema = z.array(IncomingAttackDtoSchema);

export function useIncomingAttacksQuery(villageId: string | null) {
  return useQuery<IncomingAttackDto[]>({
    queryKey: queryKeys.incomingAttacks(villageId),
    queryFn: async () => {
      if (!villageId) return [] as IncomingAttackDto[];
      const raw = await apiClient.get<unknown>(`/combat/${villageId}/incoming`);
      return IncomingAttackDtoArraySchema.parse(raw);
    },
    enabled: Boolean(villageId),
    refetchInterval: (query) =>
      !villageId
        ? false
        : query.state.data && query.state.data.length > 0
          ? 5_000
          : 30_000,
    staleTime: 2_000,
  });
}

export function useOpenConquestsQuery(worldId: string | null) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<OpenConquestDto[]>({
    queryKey: queryKeys.openConquests(userId, worldId),
    queryFn: () => {
      if (!userId || !worldId) return Promise.resolve([] as OpenConquestDto[]);
      return apiClient.get<OpenConquestDto[]>("/combat/conquests/open", {
        query: { worldId },
      });
    },
    enabled: Boolean(userId && worldId),
    refetchInterval: (query) =>
      query.state.data && query.state.data.length > 0 ? 10_000 : false,
    staleTime: 2_000,
  });
}

export function useOpenExpeditionsQuery(worldId: string | null) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  return useQuery<OpenExpeditionDto[]>({
    queryKey: queryKeys.openExpeditions(userId, worldId),
    queryFn: () => {
      if (!userId || !worldId)
        return Promise.resolve([] as OpenExpeditionDto[]);
      return apiClient.get<OpenExpeditionDto[]>("/combat/expeditions/open", {
        query: { worldId },
      });
    },
    enabled: Boolean(userId && worldId),
    refetchInterval: (query) =>
      query.state.data && query.state.data.length > 0 ? 5_000 : false,
    staleTime: 2_000,
  });
}

export function useGarrisonQuery(villageId: string | null) {
  return useQuery<GarrisonLine[]>({
    queryKey: queryKeys.garrison(villageId),
    queryFn: () => {
      if (!villageId) return Promise.resolve([] as GarrisonLine[]);
      return apiClient.get<GarrisonLine[]>(`/combat/${villageId}/garrison`);
    },
    enabled: Boolean(villageId),
    staleTime: 2_000,
  });
}

export type CombatReportDto = CombatReportResponse;

interface ReportHooksConfig<TList, TDetail> {
  listPath: string;
  detailPath: (id: string) => string;
  readPath: (id: string) => string;
  deletePath: (id: string) => string;
  listKey: (a: string | null, b: string | null) => readonly unknown[];
  detailKey: (a: string | null, b: string | null) => readonly unknown[];
  parseList: (raw: unknown) => TList[];
  parseDetail: (raw: unknown) => TDetail;
}

function createReportHooks<TList, TDetail>(
  cfg: ReportHooksConfig<TList, TDetail>,
) {
  function useListQuery() {
    const userId = useAuthStore((s) => s.user?.id ?? null);
    const worldId = useGameStore((s) => s.worldId);
    return useQuery<TList[]>({
      queryKey: cfg.listKey(userId, worldId),
      queryFn: async () => {
        if (!userId || !worldId) return [] as TList[];
        const raw = await apiClient.get<unknown>(cfg.listPath);
        return cfg.parseList(raw);
      },
      enabled: Boolean(userId && worldId),
      staleTime: 10_000,
    });
  }

  function useDetailQuery(reportId: string | null) {
    const userId = useAuthStore((s) => s.user?.id ?? null);
    const worldId = useGameStore((s) => s.worldId);
    return useQuery<TDetail>({
      queryKey: cfg.detailKey(reportId, worldId),
      queryFn: async () => {
        if (!reportId || !worldId)
          return Promise.reject(new Error("Missing report"));
        const raw = await apiClient.get<unknown>(cfg.detailPath(reportId));
        return cfg.parseDetail(raw);
      },
      enabled: Boolean(reportId && userId && worldId),
      staleTime: 60_000,
    });
  }

  function useMarkReadMutation() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id ?? null);
    const worldId = useGameStore((s) => s.worldId);
    return useMutation<TDetail, Error, { reportId: string }>({
      mutationFn: async ({ reportId }) => {
        const raw = await apiClient.patch<unknown>(cfg.readPath(reportId));
        return cfg.parseDetail(raw);
      },
      onSettled: (_data, _err, { reportId }) => {
        queryClient.invalidateQueries({
          queryKey: cfg.listKey(userId, worldId),
        });
        queryClient.invalidateQueries({
          queryKey: cfg.detailKey(reportId, worldId),
        });
      },
    });
  }

  function useDeleteMutation() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id ?? null);
    const worldId = useGameStore((s) => s.worldId);
    return useMutation<unknown, Error, { reportId: string }>({
      mutationFn: ({ reportId }) =>
        apiClient.delete<unknown>(cfg.deletePath(reportId)),
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: cfg.listKey(userId, worldId),
        });
      },
    });
  }

  return {
    useListQuery,
    useDetailQuery,
    useMarkReadMutation,
    useDeleteMutation,
  };
}

const combatReport = createReportHooks<CombatReportDto, CombatReportDto>({
  listPath: "/combat/reports",
  detailPath: (id) => `/combat/report/${id}`,
  readPath: (id) => `/combat/report/${id}/read`,
  deletePath: (id) => `/combat/report/${id}`,
  listKey: queryKeys.combatReports,
  detailKey: queryKeys.combatReport,
  parseList: (raw) => CombatReportsResponseSchema.parse(raw),
  parseDetail: (raw) => CombatReportResponseSchema.parse(raw),
});
export const useCombatReportsQuery = combatReport.useListQuery;
export const useCombatReportQuery = combatReport.useDetailQuery;
export const useMarkReportReadMutation = combatReport.useMarkReadMutation;
export const useDeleteReportMutation = combatReport.useDeleteMutation;

const scoutReport = createReportHooks<ScoutReportResponse, ScoutReportResponse>(
  {
    listPath: "/combat/scout-reports",
    detailPath: (id) => `/combat/scout-report/${id}`,
    readPath: (id) => `/combat/scout-report/${id}/read`,
    deletePath: (id) => `/combat/scout-report/${id}`,
    listKey: queryKeys.scoutReports,
    detailKey: queryKeys.scoutReport,
    parseList: (raw) => ScoutReportsResponseSchema.parse(raw),
    parseDetail: (raw) => ScoutReportResponseSchema.parse(raw),
  },
);
export const useScoutReportsQuery = scoutReport.useListQuery;
export const useScoutReportQuery = scoutReport.useDetailQuery;
export const useMarkScoutReportReadMutation = scoutReport.useMarkReadMutation;
export const useDeleteScoutReportMutation = scoutReport.useDeleteMutation;

const reinforcementReport = createReportHooks<
  ReinforcementReportResponse,
  ReinforcementReportResponse
>({
  listPath: "/combat/reinforcement-reports",
  detailPath: (id) => `/combat/reinforcement-report/${id}`,
  readPath: (id) => `/combat/reinforcement-report/${id}/read`,
  deletePath: (id) => `/combat/reinforcement-report/${id}`,
  listKey: queryKeys.reinforcementReports,
  detailKey: queryKeys.reinforcementReport,
  parseList: (raw) => ReinforcementReportsResponseSchema.parse(raw),
  parseDetail: (raw) => ReinforcementReportResponseSchema.parse(raw),
});
export const useReinforcementReportsQuery = reinforcementReport.useListQuery;
export const useReinforcementReportQuery = reinforcementReport.useDetailQuery;
export const useMarkReinforcementReportReadMutation =
  reinforcementReport.useMarkReadMutation;
export const useDeleteReinforcementReportMutation =
  reinforcementReport.useDeleteMutation;

const caravanReport = createReportHooks<
  CaravanReportResponse,
  CaravanReportResponse
>({
  listPath: "/combat/caravan-reports",
  detailPath: (id) => `/combat/caravan-report/${id}`,
  readPath: (id) => `/combat/caravan-report/${id}/read`,
  deletePath: (id) => `/combat/caravan-report/${id}`,
  listKey: queryKeys.caravanReports,
  detailKey: queryKeys.caravanReport,
  parseList: (raw) => CaravanReportsResponseSchema.parse(raw),
  parseDetail: (raw) => CaravanReportResponseSchema.parse(raw),
});
export const useCaravanReportsQuery = caravanReport.useListQuery;
export const useCaravanReportQuery = caravanReport.useDetailQuery;
export const useMarkCaravanReportReadMutation =
  caravanReport.useMarkReadMutation;
export const useDeleteCaravanReportMutation = caravanReport.useDeleteMutation;

interface AttackInput {
  villageId: string;
  targetX: number;
  targetY: number;
  targetKind: "PLAYER_VILLAGE" | "BARBARIAN_VILLAGE";
  targetRefId: string;
  units: Record<string, number>;
}

export function useInitiateAttackMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<void, Error, AttackInput>({
    mutationFn: ({
      villageId,
      targetX,
      targetY,
      targetKind,
      targetRefId,
      units,
    }) =>
      apiClient.post<void>("/combat/attack", {
        villageId,
        targetX,
        targetY,
        targetKind,
        targetRefId,
        units,
      }),
    onSettled: (_data, _err, { villageId }) => {
      invalidateCombatDispatchQueries(queryClient, villageId, userId, worldId);
    },
  });
}

export function useInitiateScoutMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<void, Error, AttackInput>({
    mutationFn: ({
      villageId,
      targetX,
      targetY,
      targetKind,
      targetRefId,
      units,
    }) =>
      apiClient.post<void>("/combat/scout", {
        villageId,
        targetX,
        targetY,
        targetKind,
        targetRefId,
        units,
      }),
    onSettled: (_data, _err, { villageId }) => {
      invalidateCombatDispatchQueries(queryClient, villageId, userId, worldId);
    },
  });
}

interface RecallExpeditionInput {
  expeditionId: string;
  villageId: string;
}

export function useRecallExpeditionMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<Expedition, Error, RecallExpeditionInput>({
    mutationFn: ({ expeditionId }) =>
      apiClient.post<Expedition>(`/combat/recall/${expeditionId}`, {}),
    onSuccess: (expedition, { expeditionId }) => {
      const store = useExpeditionsStore.getState();
      const current = store.byId[expeditionId];
      const returnAt = expedition.returnAt
        ? Date.parse(String(expedition.returnAt))
        : undefined;
      store.update(
        expeditionId,
        current && returnAt
          ? current.phase === "RETURNING"
            ? { phase: "RETURNING", returnAt }
            : buildRecalledExpeditionPatch(current, Date.now(), returnAt)
          : {
              phase: "RETURNING",
              returnAt: returnAt ?? current?.returnAt,
            },
      );
    },
    onSettled: (_data, _err, { villageId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.population(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activeExpeditions(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.openExpeditions(userId, worldId),
      });
    },
  });
}

export function useInitiateReinforceMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<Expedition, Error, ReinforcePayload>({
    mutationFn: ({ villageId, targetVillageId, units }) =>
      apiClient.post<Expedition>("/combat/reinforce", {
        villageId,
        targetVillageId,
        units,
      }),
    onSettled: (_data, _err, { villageId, targetVillageId }) => {
      invalidateTroopMovementQueries(
        queryClient,
        [villageId, targetVillageId],
        userId,
        worldId,
      );
    },
  });
}

export function useInitiateCaravanMutation(): UseMutationResult<
  Expedition,
  Error,
  CaravanPayload
> {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<Expedition, Error, CaravanPayload>({
    mutationFn: ({ villageId, targetVillageId, resources }) =>
      apiClient.post<Expedition>("/combat/caravan", {
        villageId,
        targetVillageId,
        resources,
      }),
    onSettled: (_data, _err, { villageId, targetVillageId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.resources(targetVillageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.population(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activeExpeditions(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.openExpeditions(userId, worldId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.villagePower(villageId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.kingdomPowerPrefix(userId),
      });
    },
  });
}

export function useRecallReinforcementMutation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  return useMutation<Expedition, Error, RecallReinforcementPayload>({
    mutationFn: ({ villageId, originVillageId, units }) =>
      apiClient.post<Expedition>("/combat/recall", {
        villageId,
        originVillageId,
        units,
      }),
    onSettled: (_data, _err, { villageId, originVillageId }) => {
      invalidateTroopMovementQueries(
        queryClient,
        [villageId, originVillageId],
        userId,
        worldId,
      );
    },
  });
}
