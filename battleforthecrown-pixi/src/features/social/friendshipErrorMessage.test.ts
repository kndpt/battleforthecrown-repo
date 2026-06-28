import { describe, expect, it } from "vitest";
import { ApiError } from "@/api";
import { FRIENDSHIP_ERROR_CODES } from "@battleforthecrown/shared/social";
import {
  friendshipErrorCode,
  friendshipErrorMessage,
} from "./friendshipErrorMessage";

function apiError(status: number, body: unknown): ApiError {
  return new ApiError("server message", status, body);
}

describe("friendshipErrorCode", () => {
  it("reads the machine code from the ApiError payload", () => {
    expect(
      friendshipErrorCode(
        apiError(409, { code: FRIENDSHIP_ERROR_CODES.CAP_REACHED }),
      ),
    ).toBe(FRIENDSHIP_ERROR_CODES.CAP_REACHED);
  });

  it("returns null for non-ApiError or codeless payloads", () => {
    expect(friendshipErrorCode(new Error("boom"))).toBeNull();
    expect(friendshipErrorCode(apiError(409, { message: "x" }))).toBeNull();
  });
});

describe("friendshipErrorMessage", () => {
  it("maps each conflict code to a distinct message", () => {
    const already = friendshipErrorMessage(
      apiError(409, { code: FRIENDSHIP_ERROR_CODES.ALREADY_ACTIVE }),
      "fallback",
    );
    const pending = friendshipErrorMessage(
      apiError(409, { code: FRIENDSHIP_ERROR_CODES.PENDING_AWAITING_ACCEPT }),
      "fallback",
    );
    const cap = friendshipErrorMessage(
      apiError(409, { code: FRIENDSHIP_ERROR_CODES.CAP_REACHED }),
      "fallback",
    );
    expect(new Set([already, pending, cap]).size).toBe(3);
    expect(pending).toMatch(/acceptez/i);
    expect(cap).toMatch(/cap/i);
  });

  it("explains an unknown pseudo on a 404", () => {
    expect(friendshipErrorMessage(apiError(404, {}), "fallback")).toMatch(
      /pseudo/i,
    );
  });

  it("falls back to the server message then to the provided fallback", () => {
    expect(friendshipErrorMessage(apiError(500, {}), "fallback")).toBe(
      "server message",
    );
    expect(friendshipErrorMessage(new Error("nope"), "fallback")).toBe(
      "fallback",
    );
  });
});
