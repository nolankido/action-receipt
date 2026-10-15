"use client";

import { useEffect, useRef } from "react";
import { Info, TriangleAlert } from "lucide-react";
import { planDownloadFeedback, type DownloadOutput, type DownloadRequest } from "../lib/download-request.ts";

export default function DownloadFeedback({ request, current }: { request: DownloadRequest | null; current: DownloadOutput }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => { if (request) container.current?.scrollIntoView({ block: "nearest", behavior: "instant" }); }, [request]);
  const plan = request ? planDownloadFeedback(request, current) : null;
  return <div ref={container} className="download-feedback-live" role={plan?.error ? "alert" : "status"} aria-atomic="true">{plan && <div className={`download-feedback ${plan.error ? "has-error" : plan.stale ? "is-stale" : ""}`}>
    {plan.error ? <TriangleAlert size={18} aria-hidden="true" /> : <Info size={18} aria-hidden="true" />}
    <div><h3>{plan.title}</h3><p>{plan.message}</p></div>
  </div>}</div>;
}
