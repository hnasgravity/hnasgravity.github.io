import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://hnasgravity.github.io/",
    title: "HNAS Gravity",
    description:
      "Homepage of the gravity research group at Henan Academy of Sciences.",
    author: "Junjie Zhao",
    profile: "https://github.com/BenjaminDbb",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 10,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/hnasgravity/hnasgravity.github.io/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github", url: "https://github.com/hnasgravity/hnasgravity.github.io" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
    // WeChat has no web share endpoint; clicking shows a QR code of the
    // post URL for scanning instead of opening a share URL.
    { name: "wechat",   url: "", linkTitle: "Share this post on WeChat" },
  ],
});
