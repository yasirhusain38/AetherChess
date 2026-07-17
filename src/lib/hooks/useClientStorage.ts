"use client";

import { useSyncExternalStore } from "react";
import { getStorageEpoch, subscribeStorage } from "@/lib/storage";

export function useStorageEpoch() {
  return useSyncExternalStore(subscribeStorage, getStorageEpoch, () => 0);
}
