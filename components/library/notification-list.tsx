"use client";

import Link from "next/link";
import { useState } from "react";

import type { LibraryNotificationItem } from "@/types/library";

type ApiSuccess<T> = {
  data: T;
  message?: string;
};

type ApiFailure = {
  error: string;
  code: string;
  status: number;
};

type MarkAllReadResult = {
  readAt: string;
  updatedCount: number;
};

type NotificationListProps = {
  items: LibraryNotificationItem[];
};

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationList({ items }: NotificationListProps) {
  const [notifications, setNotifications] = useState(items);
  const [busyId, setBusyId] = useState<string | null>(null);
  const unreadCount = notifications.filter((item) => item.readAt === null).length;

  async function markAsRead(id: string) {
    setBusyId(id);

    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          read: true,
        }),
      });
      const payload = (await response.json()) as
        | ApiSuccess<LibraryNotificationItem>
        | ApiFailure;

      if (!response.ok || !("data" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "通知状态更新失败，请稍后重试。",
        );
      }

      setNotifications((current) =>
        current.map((item) => (item.id === id ? payload.data : item)),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId(null);
    }
  }

  async function markAllAsRead() {
    setBusyId("all");

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          readAll: true,
        }),
      });
      const payload = (await response.json()) as
        | ApiSuccess<MarkAllReadResult>
        | ApiFailure;

      if (!response.ok || !("data" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "通知状态更新失败，请稍后重试。",
        );
      }

      setNotifications((current) =>
        current.map((item) =>
          item.readAt
            ? item
            : {
                ...item,
                readAt: payload.data.readAt,
              },
        ),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-4">
      {unreadCount > 0 ? (
        <div className="flex justify-end">
          <button
            className="glass-chip-active inline-flex px-3 py-2 text-[10px] uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busyId === "all"}
            onClick={() => void markAllAsRead()}
            type="button"
          >
            {busyId === "all" ? "处理中…" : `全部标记已读 (${unreadCount})`}
          </button>
        </div>
      ) : null}
      {notifications.map((item) => (
        <article
          key={item.id}
          className={`glass-surface-soft grid gap-4 px-4 py-4 transition duration-card md:grid-cols-[1fr_auto] ${
            item.readAt ? "" : "ring-1 ring-red/20"
          }`}
        >
          <div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.22em]">
              <span className="glass-chip px-3 py-2 text-muted">
                {item.kind.replace(/_/g, " ")}
              </span>
              <span className="text-muted">{formatCreatedAt(item.createdAt)}</span>
              {item.readAt ? (
                <span className="text-muted">已读</span>
              ) : (
                <span className="text-red">未读</span>
              )}
            </div>
            <p className="mt-3 font-body text-[24px] font-semibold leading-none text-ink">
              {item.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">{item.body}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            {item.href ? (
              <Link
                className="glass-chip inline-flex px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-muted transition hover:text-ink"
                href={item.href}
              >
                查看详情
              </Link>
            ) : null}
            {!item.readAt ? (
              <button
                className="glass-chip-active inline-flex px-3 py-2 text-[10px] uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busyId === item.id}
                onClick={() => void markAsRead(item.id)}
                type="button"
              >
                {busyId === item.id ? "处理中…" : "标记已读"}
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
