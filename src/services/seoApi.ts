import type { SlugAvailabilityResponse } from "../types/seo";
import { safeFetchApi } from "./api";

export async function checkProductSlugAvailability(
  slug: string,
  currentId?: string
): Promise<SlugAvailabilityResponse> {
  const params = new URLSearchParams();
  params.set("slug", slug);
  if (currentId) params.set("currentId", currentId);

  const response = await safeFetchApi(`/products/check-slug?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to check slug availability");
  }

  return response.json();
}
