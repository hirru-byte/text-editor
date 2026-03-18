"use client";

import dynamic from "next/dynamic";

const PlaygroundApp = dynamic(() => import("@/playground/PlaygroundApp"), {
  ssr: false,
});

export default function PlaygroundPage() {
  return <PlaygroundApp />;
}
