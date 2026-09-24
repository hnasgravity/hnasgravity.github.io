export interface UIStrings {
  nav: {
    home: string;
    activities: string;
    tags: string;
    about: string;
    archives: string;
    search: string;
  };
  post: {
    updatedAt: string;
    sharePostIntro: string;
    sharePostOn: string;
    sharePostViaEmail: string;
    sharePostViaWechatQr: string;
    backToTop: string;
    goBack: string;
    editPage: string;
    previousPost: string;
    nextPost: string;
  };
  pagination: {
    prev: string;
    next: string;
    page: string;
  };
  home: {
    socialLinks: string;
    featured: string;
    allPosts: string;
    noCategoryPosts: string;
    viewAllCategoryPosts: string;
  };
  /**
   * Display names for the post categories declared in
   * `src/utils/postCategories.ts`. Each key must match a `labelKey` there.
   */
  categories: {
    groupMeeting: string;
    mingliSeminar: string;
  };
  footer: {
    copyright: string;
    allRightsReserved: string;
  };
  pages: {
    tagTitle: string;
    tagDesc: string;

    tagsTitle: string;
    tagsDesc: string;

    categoriesTitle: string;
    categoriesDesc: string;
    categoryDesc: string;

    archivesTitle: string;
    archivesDesc: string;

    searchTitle: string;
    searchDesc: string;
  };
  a11y: {
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    toggleTheme: string;
    goToPreviousPage: string;
    goToNextPage: string;
  };
  notFound: {
    title: string;
    message: string;
    goHome: string;
  };
}
