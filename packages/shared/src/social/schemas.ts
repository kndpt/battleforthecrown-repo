import { z } from "zod";

/**
 * Body of `POST /worlds/:worldId/friendships`. The caller identifies the
 * recipient either by id or by display name (pseudo) — exactly one is required.
 */
export const CreateFriendshipSchema = z
  .object({
    recipientUserId: z.string().min(1).optional(),
    recipientDisplayName: z.string().min(1).optional(),
  })
  .refine(
    (body) =>
      Boolean(body.recipientUserId) !== Boolean(body.recipientDisplayName),
    {
      message:
        "Provide exactly one of recipientUserId or recipientDisplayName",
    },
  );

export type CreateFriendshipBody = z.infer<typeof CreateFriendshipSchema>;

const FriendshipStatusSchema = z.enum(["PENDING", "ACTIVE"]);

export const FriendshipDtoSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  status: FriendshipStatusSchema,
  otherUserId: z.string(),
  otherDisplayName: z.string(),
  isRequester: z.boolean(),
  createdAt: z.string(),
  acceptedAt: z.string().nullable(),
});

export const MyFriendshipsResponseSchema = z.object({
  active: z.array(FriendshipDtoSchema),
  pendingOut: z.array(FriendshipDtoSchema),
  pendingIn: z.array(FriendshipDtoSchema),
});
