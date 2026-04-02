import { NextResponse } from "next/server";
import { ZodError } from "zod";

export { captureServerException, createRouteLogger } from "@/lib/monitoring";

export function jsonSuccess<T>(
  data: T,
  init?: {
    headers?: HeadersInit;
    status?: number;
    message?: string;
  },
) {
  return NextResponse.json(
    {
      data,
      ...(init?.message ? { message: init.message } : {}),
    },
    {
      headers: init?.headers,
      status: init?.status ?? 200,
    },
  );
}

export function jsonError(
  message: string,
  init: {
    status: number;
    code?: string;
    details?: unknown;
    headers?: HeadersInit;
  },
) {
  return NextResponse.json(
    {
      error: message,
      code: init.code ?? "UNKNOWN_ERROR",
      status: init.status,
      ...(init.details !== undefined ? { details: init.details } : {}),
    },
    {
      headers: init.headers,
      status: init.status,
    },
  );
}

export function formatZodError(error: ZodError) {
  return error.flatten();
}
