"use client";

import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { bottts } from "@dicebear/collection";

/**
 * Free DiceBear "bottts" avatar (by Pablo Stanley — free for personal
 * and commercial use), generated locally from the player's nickname:
 * same name, same character, no external requests.
 */
export function avatarUri(seed: string): string {
  return createAvatar(bottts, { seed, size: 96 }).toDataUri();
}

export default function Avatar({
  seed,
  className = "h-8 w-8",
}: {
  seed: string;
  className?: string;
}) {
  const uri = useMemo(() => avatarUri(seed), [seed]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={uri} alt="" className={`${className} rounded-full border border-zinc-800 bg-card`} />;
}
