import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  MapMarkerDto,
  CreateMapMarkerBody,
  UpdateMapMarkerBody,
} from "@battleforthecrown/shared/map-markers";
import { MapMarkerDtoSchema } from "@battleforthecrown/shared/map-markers";
import { apiClient } from "../index";
import { queryKeys } from "./keys";

export const mapMarkersQueryOptions = (worldId: string | null) =>
  queryOptions({
    queryKey: queryKeys.mapMarkers(worldId),
    queryFn: async (): Promise<MapMarkerDto[]> => {
      if (!worldId) return [];
      const raw = await apiClient.get<unknown>(
        `/worlds/${worldId}/map-markers`,
      );
      return MapMarkerDtoSchema.array().parse(raw);
    },
    enabled: Boolean(worldId),
    staleTime: 30_000,
  });

export function useMapMarkersQuery(worldId: string | null) {
  return useQuery(mapMarkersQueryOptions(worldId));
}

type UpsertMapMarkerInput = CreateMapMarkerBody;

export function useUpsertMapMarkerMutation(worldId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    MapMarkerDto,
    Error,
    UpsertMapMarkerInput,
    { previousMarkers?: MapMarkerDto[] }
  >({
    mutationFn: async (body) => {
      const raw = await apiClient.post<unknown>(
        `/worlds/${worldId}/map-markers`,
        body,
      );
      return MapMarkerDtoSchema.parse(raw);
    },
    onMutate: async (input) => {
      const key = queryKeys.mapMarkers(worldId);
      await queryClient.cancelQueries({ queryKey: key });
      const previousMarkers = queryClient.getQueryData<MapMarkerDto[]>(key);
      const now = new Date().toISOString();
      const optimistic: MapMarkerDto = {
        id: `optimistic-marker-${input.x}-${input.y}-${Date.now()}`,
        worldId,
        x: input.x,
        y: input.y,
        kind: input.kind,
        note: input.note,
        createdAt: now,
        updatedAt: now,
      };
      queryClient.setQueryData<MapMarkerDto[]>(key, (current = []) => {
        const filtered = current.filter(
          (m) => !(m.x === input.x && m.y === input.y),
        );
        return [...filtered, optimistic];
      });
      return { previousMarkers };
    },
    onError: (_err, _input, context) => {
      if (context?.previousMarkers !== undefined) {
        queryClient.setQueryData(
          queryKeys.mapMarkers(worldId),
          context.previousMarkers,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mapMarkers(worldId) });
    },
  });
}

interface UpdateMapMarkerInput {
  id: string;
  body: UpdateMapMarkerBody;
}

export function useUpdateMapMarkerMutation(worldId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    MapMarkerDto,
    Error,
    UpdateMapMarkerInput,
    { previousMarkers?: MapMarkerDto[] }
  >({
    mutationFn: async ({ id, body }) => {
      const raw = await apiClient.patch<unknown>(
        `/worlds/${worldId}/map-markers/${id}`,
        body,
      );
      return MapMarkerDtoSchema.parse(raw);
    },
    onMutate: async ({ id, body }) => {
      const key = queryKeys.mapMarkers(worldId);
      await queryClient.cancelQueries({ queryKey: key });
      const previousMarkers = queryClient.getQueryData<MapMarkerDto[]>(key);
      queryClient.setQueryData<MapMarkerDto[]>(key, (current = []) =>
        current.map((m) =>
          m.id === id
            ? {
                ...m,
                ...(body.kind !== undefined ? { kind: body.kind } : {}),
                ...(body.note !== undefined ? { note: body.note } : {}),
                updatedAt: new Date().toISOString(),
              }
            : m,
        ),
      );
      return { previousMarkers };
    },
    onError: (_err, _input, context) => {
      if (context?.previousMarkers !== undefined) {
        queryClient.setQueryData(
          queryKeys.mapMarkers(worldId),
          context.previousMarkers,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mapMarkers(worldId) });
    },
  });
}

interface DeleteMapMarkerInput {
  id: string;
}

export function useDeleteMapMarkerMutation(worldId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    DeleteMapMarkerInput,
    { previousMarkers?: MapMarkerDto[] }
  >({
    mutationFn: ({ id }) =>
      apiClient.delete<void>(`/worlds/${worldId}/map-markers/${id}`),
    onMutate: async ({ id }) => {
      const key = queryKeys.mapMarkers(worldId);
      await queryClient.cancelQueries({ queryKey: key });
      const previousMarkers = queryClient.getQueryData<MapMarkerDto[]>(key);
      queryClient.setQueryData<MapMarkerDto[]>(key, (current = []) =>
        current.filter((m) => m.id !== id),
      );
      return { previousMarkers };
    },
    onError: (_err, _input, context) => {
      if (context?.previousMarkers !== undefined) {
        queryClient.setQueryData(
          queryKeys.mapMarkers(worldId),
          context.previousMarkers,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mapMarkers(worldId) });
    },
  });
}
