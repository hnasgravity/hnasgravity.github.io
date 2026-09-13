import type { CollectionEntry } from "astro:content";

/**
 * Determines whether a post is eligible to be listed/rendered.
 *
 * - Excludes drafts always
 * - Publishes immediately: the scheduled-post time check is intentionally
 *   bypassed so posts appear as soon as they are committed, even if
 *   `pubDatetime` is in the future
 */
export function postFilter({ data }: CollectionEntry<"posts">) {
  const isPublishTimePassed = true;
  // Date.now() >
  // new Date(data.pubDatetime).getTime() - config.posts.scheduledPostMargin;
  return !data.draft && (import.meta.env.DEV || isPublishTimePassed);
}
