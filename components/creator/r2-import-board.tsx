"use client";

import { useEffect, useMemo, useState } from "react";

import type { R2ImportSummary } from "@/types/r2-import";

type ApiSuccess<T> = {
  data: T;
  message?: string;
};

type ApiFailure = {
  error: string;
  code: string;
  status: number;
};

type R2ImportBoardProps = {
  defaultCreatorUsername: string;
};

function formatFileSize(size: number) {
  if (size <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

export function R2ImportBoard({
  defaultCreatorUsername,
}: R2ImportBoardProps) {
  const [creatorUsername, setCreatorUsername] = useState(
    defaultCreatorUsername,
  );
  const [prefix, setPrefix] = useState("");
  const [limit, setLimit] = useState("24");
  const [summary, setSummary] = useState<R2ImportSummary | null>(null);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const [busyAction, setBusyAction] = useState<"scan" | "import" | null>(null);

  const pendingCandidates = useMemo(
    () => summary?.candidates.filter((candidate) => !candidate.alreadyImported) ?? [],
    [summary],
  );

  async function requestSummary(method: "GET" | "POST") {
    const requestLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);

    if (method === "GET") {
      const params = new URLSearchParams({
        limit: String(requestLimit),
      });

      if (prefix.trim()) {
        params.set("prefix", prefix.trim());
      }

      const response = await fetch(`/api/wallpapers/import-r2?${params.toString()}`);
      const payload = (await response.json()) as
        | ApiSuccess<R2ImportSummary>
        | ApiFailure;

      if (!response.ok || !("data" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "扫描 R2 失败，请稍后再试。",
        );
      }

      return payload.data;
    }

    const response = await fetch("/api/wallpapers/import-r2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creatorUsername: creatorUsername.trim() || undefined,
        limit: requestLimit,
        prefix: prefix.trim() || undefined,
      }),
    });
    const payload = (await response.json()) as
      | ApiSuccess<R2ImportSummary>
      | ApiFailure;

    if (!response.ok || !("data" in payload)) {
      throw new Error(
        "error" in payload ? payload.error : "导入 R2 文件失败，请稍后再试。",
      );
    }

    return payload.data;
  }

  async function handleScan() {
    setBusyAction("scan");
    setFeedback(null);

    try {
      const nextSummary = await requestSummary("GET");
      setSummary(nextSummary);
      setCreatorUsername(nextSummary.creatorUsername);
      setFeedback({
        kind: "success",
        message:
          nextSummary.pendingCount > 0
            ? `已扫描到 ${nextSummary.pendingCount} 个待导入文件。`
            : "R2 里暂时没有新的待导入文件。",
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error ? error.message : "扫描 R2 失败，请稍后再试。",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleImport() {
    setBusyAction("import");
    setFeedback(null);

    try {
      const nextSummary = await requestSummary("POST");
      setSummary(nextSummary);
      setFeedback({
        kind: "success",
        message: `本次导入完成：成功 ${nextSummary.results.filter((item) => item.status === "imported").length} 个，失败 ${nextSummary.failedCount} 个。`,
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error ? error.message : "导入 R2 文件失败，请稍后再试。",
      });
    } finally {
      setBusyAction(null);
    }
  }

  useEffect(() => {
    void handleScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 border border-ink/10 bg-paper/70 p-5 md:grid-cols-[1.1fr_1fr_180px_auto_auto] md:items-end">
        <div>
          <label
            className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted"
            htmlFor="r2-import-creator"
          >
            导入归属创作者
          </label>
          <input
            id="r2-import-creator"
            className="w-full border border-ink bg-paper px-4 py-3 text-sm outline-none transition focus:border-red"
            value={creatorUsername}
            onChange={(event) => setCreatorUsername(event.target.value)}
            placeholder="Lumen"
          />
        </div>

        <div>
          <label
            className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted"
            htmlFor="r2-import-prefix"
          >
            扫描前缀
          </label>
          <input
            id="r2-import-prefix"
            className="w-full border border-ink bg-paper px-4 py-3 text-sm outline-none transition focus:border-red"
            value={prefix}
            onChange={(event) => setPrefix(event.target.value)}
            placeholder="留空表示整个 bucket"
          />
        </div>

        <div>
          <label
            className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted"
            htmlFor="r2-import-limit"
          >
            扫描数量
          </label>
          <input
            id="r2-import-limit"
            className="w-full border border-ink bg-paper px-4 py-3 text-sm outline-none transition focus:border-red"
            inputMode="numeric"
            value={limit}
            onChange={(event) => setLimit(event.target.value.replace(/[^\d]/g, ""))}
          />
        </div>

        <button
          className="inline-flex justify-center border border-ink bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busyAction !== null}
          type="button"
          onClick={handleScan}
        >
          {busyAction === "scan" ? "扫描中" : "重新扫描"}
        </button>

        <button
          className="inline-flex justify-center border border-[#52c67b] bg-[#59ca80] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busyAction !== null || pendingCandidates.length === 0}
          type="button"
          onClick={handleImport}
        >
          {busyAction === "import"
            ? "导入中"
            : pendingCandidates.length > 0
              ? `一键导入 ${pendingCandidates.length} 个`
              : "暂无待导入文件"}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="border border-ink/10 bg-paper/70 px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
            扫描到
          </p>
          <p className="mt-2 font-mono text-[2rem] tracking-[-0.06em] text-ink">
            {summary?.scannedCount ?? 0}
          </p>
        </div>
        <div className="border border-ink/10 bg-paper/70 px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
            待导入
          </p>
          <p className="mt-2 font-mono text-[2rem] tracking-[-0.06em] text-red">
            {summary?.pendingCount ?? 0}
          </p>
        </div>
        <div className="border border-ink/10 bg-paper/70 px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
            已在前台
          </p>
          <p className="mt-2 font-mono text-[2rem] tracking-[-0.06em] text-ink">
            {summary?.importedCount ?? 0}
          </p>
        </div>
        <div className="border border-ink/10 bg-paper/70 px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
            导入失败
          </p>
          <p className="mt-2 font-mono text-[2rem] tracking-[-0.06em] text-gold">
            {summary?.failedCount ?? 0}
          </p>
        </div>
      </div>

      {feedback ? (
        <p
          className={`text-sm ${
            feedback.kind === "success" ? "text-[#2f7d57]" : "text-red"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="border border-ink/10 bg-paper/70">
          <div className="border-b border-ink/10 px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
              待导入文件
            </p>
            <p className="mt-2 text-sm text-muted">
              这里列的是 bucket 里还没有写入前台数据库的原始文件。
            </p>
          </div>

          <div className="divide-y divide-ink/10">
            {summary?.candidates.length ? (
              summary.candidates.map((candidate) => (
                <div
                  key={candidate.key}
                  className="space-y-2 px-5 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-ink/10 bg-paper px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                      {candidate.kind}
                    </span>
                    <span
                      className={`border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                        candidate.alreadyImported
                          ? "border-[#52c67b]/30 bg-[#52c67b]/10 text-[#2f7d57]"
                          : "border-red/20 bg-red/5 text-red"
                      }`}
                    >
                      {candidate.alreadyImported ? "已入库" : "待导入"}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
                      {formatFileSize(candidate.size)}
                    </span>
                  </div>
                  <p className="font-medium text-ink">{candidate.inferredTitle}</p>
                  <p className="break-all text-xs leading-6 text-muted">
                    {candidate.key}
                  </p>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted">
                当前没有扫描到可导入文件。
              </div>
            )}
          </div>
        </section>

        <section className="border border-ink/10 bg-paper/70">
          <div className="border-b border-ink/10 px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
              最近导入结果
            </p>
            <p className="mt-2 text-sm text-muted">
              导入完成后，这里会显示每个文件的处理结果。
            </p>
          </div>

          <div className="divide-y divide-ink/10">
            {summary?.results.length ? (
              summary.results.map((result) => (
                <div key={result.key} className="space-y-2 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                        result.status === "imported"
                          ? "border-[#52c67b]/30 bg-[#52c67b]/10 text-[#2f7d57]"
                          : result.status === "failed"
                            ? "border-red/20 bg-red/5 text-red"
                            : "border-ink/10 bg-paper text-muted"
                      }`}
                    >
                      {result.status}
                    </span>
                    {result.slug ? (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
                        {result.slug}
                      </span>
                    ) : null}
                  </div>
                  <p className="font-medium text-ink">{result.title}</p>
                  <p className="text-sm leading-6 text-muted">{result.message}</p>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-muted">
                还没有执行导入。
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
