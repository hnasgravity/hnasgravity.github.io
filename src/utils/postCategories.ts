import type { CollectionEntry } from "astro:content";
import { BLOG_PATH } from "@/content.config";
import type { UIStrings } from "@/i18n/types";
import { slugifyStr } from "./slugify";

/**
 * A category is the top-level folder a post lives in under `src/content/posts`,
 * so `posts/group-meeting/2026-09-16.md` belongs to `group-meeting` and is
 * served from `/posts/group-meeting/2026-09-16/`.
 *
 * This array is the single source of truth for the categories the site exposes.
 * It drives the homepage sections, the `/categories/` index and the
 * `/categories/<slug>/` listings. To add one: create the folder under
 * `src/content/posts`, add an entry here, and add the matching label to every
 * `src/i18n/lang/*.ts`.
 */
export const POST_CATEGORIES = [
  { slug: "group-meeting", labelKey: "groupMeeting" },
  { slug: "mingli-seminar", labelKey: "mingliSeminar" },
] as const satisfies readonly {
  slug: string;
  labelKey: keyof UIStrings["categories"];
}[];

/**
 * Returns the top-level folder a post lives in, or `undefined` for posts that
 * sit directly in `src/content/posts` (uncategorised).
 *
 * This mirrors `getPostPathSegments` in `getPostPaths.ts`, so a category is
 * always the first URL segment of the post — `posts/<category>/<slug>/`.
 */
function getPostCategory(filePath: string | undefined): string | undefined {
  const segments =
    filePath
      ?.replace(BLOG_PATH, "")
      .split("/")
      .filter(segment => segment !== "")
      .filter(segment => !segment.startsWith("_"))
      .slice(0, -1)
      .map(segment => slugifyStr(segment)) ?? [];

  return segments.length > 0 ? segments[0] : undefined;
}

/**
 * Returns the posts belonging to `category`, preserving the order of `posts`.
 * Pass the output of `getSortedPosts` to keep the newest-first ordering.
 */
export function getPostsByCategory(
  posts: CollectionEntry<"posts">[],
  category: string
): CollectionEntry<"posts">[] {
  return posts.filter(post => getPostCategory(post.filePath) === category);
}
