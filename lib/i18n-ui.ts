import type { SupportedLocale } from "@/types/i18n";

type HomeUiCopy = {
  category: {
    all: string;
  };
  darkroom: {
    body: string;
    cta: string;
    eyebrow: string;
    hintLine1: string;
    hintLine2: string;
    titleLine1: string;
    titleLine2: string;
    titleAccent: string;
  };
  editorial: {
    cta: string;
    eyebrow: string;
    hintLine1: string;
    hintLine2: string;
    titleAccent: string;
    titleLine1: string;
    titleLine2: string;
  };
  footer: {
    madeWith: string;
    taglineLine1: string;
    taglineLine2: string;
  };
  hero: {
    badge: string;
    categoryFeatured: string;
    categoryPopular: string;
    h1Line1: string;
    h1Line2: string;
    searchLabel: string;
    searchPlaceholder: string;
    searchSubmit: string;
    shortcutDarkroom: string;
    shortcutMotion: string;
    shortcutUpload: string;
    subtitle: string;
  };
  ios: {
    body: string;
    cta: string;
    eyebrow: string;
    hintLine1: string;
    hintLine2: string;
    noteBody: string;
    noteTitle: string;
    titleLine1: string;
    titleLine2: string;
  };
  join: {
    body: string;
    drag: string;
    eyebrow: string;
    limit: string;
    metricCreators: string;
    metricRevenue: string;
    metricWorks: string;
    titleLine1: string;
    titleLine2: string;
    titleAccent: string;
  };
  mood: {
    body: string;
    cta: string;
    eyebrow: string;
    titleAccent: string;
    titlePrefix: string;
    titleSuffix: string;
  };
  search: {
    allTag: string;
    body: string;
    categoryTitle: string;
    eyebrow: string;
    inputLabel: string;
    placeholder: string;
    sortTitle: string;
    submit: string;
    title: string;
  };
};

type ExploreUiCopy = {
  allCategories: string;
  allDirectory: string;
  allFilters: string;
  allTag: string;
  clearAll: string;
  clearCategory: string;
  clearFeatured: string;
  clearKeyword: string;
  clearTag: string;
  currentFilters: string;
  defaultDescription: string;
  emptyBody: string;
  emptyTitle: string;
  errorTitle: string;
  featuredOff: string;
  featuredOn: string;
  loadingError: string;
  motionMixed: string;
  motionOff: string;
  motionOn: string;
  motionOnly: string;
  nextPage: string;
  pageCount: (input: {
    page: number;
    totalPages: number;
    total: number;
  }) => string;
  pageSize: (input: { count: number; pageSize: number }) => string;
  popularTags: string;
  previousPage: string;
  searchPlaceholder: string;
  searchSubmit: string;
  sortLabel: string;
  tagPlaceholder: string;
  topicTags: string[];
};

type DarkroomPageCopy = {
  count: (count: number) => string;
  description: string;
  empty: string;
  metricCurated: string;
  sort: string;
  title: string;
};

type WallpaperPageCopy = {
  all: string;
  detailEyebrow: string;
  moreTag: (tag: string) => string;
  notFoundTitle: string;
  relatedHeading: string;
  relatedPopular: string;
  seoFallback: (input: { tagLine: string; title: string }) => string;
};

type LocalizedHomeDataCopy = {
  categories: Record<string, string>;
  footerColumns: {
    about: string;
    creator: string;
    explore: string;
  };
  footerLinks: Record<string, string>;
  nav: {
    creator: string;
    darkroom: string;
    explore: string;
    library: string;
  };
  searchTags: Record<string, string>;
  stats: {
    creators: string;
    monthlyUsers: string;
    wallpapers: string;
  };
  ticker: Record<string, string>;
};

const HOME_UI_COPY = {
  "zh-CN": {
    category: {
      all: "全部",
    },
    darkroom: {
      body: "这一组更强调夜色、戏剧光影和更深的氛围密度。它不追求轻快，而是把画面压进更像暗房冲印的观看环境里。",
      cta: "进入暗室精选",
      eyebrow: "04 — 暗室精选",
      hintLine1: "每周策展",
      hintLine2: "编辑团队推荐",
      titleLine1: "让高反差与",
      titleLine2: "留下来",
      titleAccent: "低照度",
    },
    editorial: {
      cta: "查看本周推荐",
      eyebrow: "03 — 编辑推荐",
      hintLine1: "故事感优先",
      hintLine2: "大图慢慢看",
      titleAccent: "画面留白",
      titleLine1: "为值得停留的",
      titleLine2: "",
    },
    footer: {
      madeWith: "Made with obsession",
      taglineLine1: "每一帧都值得被看见。",
      taglineLine2: "壁纸不是装饰，是态度。",
    },
    hero: {
      badge: "Lumen Gallery is live",
      categoryFeatured: "编辑精选",
      categoryPopular: "热门下载",
      h1Line1: "每一帧，",
      h1Line2: "都值得被看见。",
      searchLabel: "搜索壁纸",
      searchPlaceholder: "搜索自然、暗色、城市、宇宙、极简...",
      searchSubmit: "搜索",
      shortcutDarkroom: "Darkroom",
      shortcutMotion: "Motion",
      shortcutUpload: "Upload",
      subtitle:
        "Lumen 收录 4K 静态壁纸、动态预览、创作者作品和暗色精选。从一个关键词开始，再按分类、热度和精选状态慢慢缩小范围。",
    },
    ios: {
      body: "优先挑选更适合锁屏与主屏排版的竖版作品，这一组也会使用更高分辨率封面，避免手机专区的卡片发虚。",
      cta: "进入 iOS 专区",
      eyebrow: "02 — iOS 专区",
      hintLine1: "竖屏优先",
      hintLine2: "锁屏与主屏更顺手",
      noteBody:
        "这里更关注时间组件、通知栏和主体留白的平衡，让壁纸在 iPhone 上更顺手，也更适合直接保存使用。",
      noteTitle: "iOS Curation Note",
      titleLine1: "为 iPhone 准备的",
      titleLine2: "竖版精选",
    },
    join: {
      body: "上传你的摄影、插画或 AI 作品。每次下载，你都获得收益分成。加入 3,200 位创作者。",
      drag: "拖拽上传你的作品",
      eyebrow: "创作者计划",
      limit: "JPG · PNG · WEBP · 最大 50MB",
      metricCreators: "活跃创作者",
      metricRevenue: "收益分成",
      metricWorks: "收录作品",
      titleLine1: "分享你",
      titleLine2: "镜头里的",
      titleAccent: "世界",
    },
    mood: {
      body: "保留静态壁纸，把氛围、角色和色彩放到同一个浏览节奏里。",
      cta: "进入情绪版",
      eyebrow: "01 · 情绪版",
      titleAccent: "心情",
      titlePrefix: "按",
      titleSuffix: "找壁纸",
    },
    search: {
      allTag: "全部",
      body: "关键词、分类、排序和精选状态都已经接到探索页。先从这里输入意图，再进入完整目录继续缩小范围。",
      categoryTitle: "分类",
      eyebrow: "Discovery console",
      inputLabel: "描述你想要的画面",
      placeholder: "例如：安静的森林、深色办公桌面、蓝色极简...",
      sortTitle: "排序",
      submit: "搜索目录",
      title: "把“随便看看”变成可控筛选。",
    },
  },
  en: {
    category: {
      all: "All",
    },
    darkroom: {
      body: "This set leans into night, dramatic light, and a deeper atmospheric density. It is slower, darker, and closer to a darkroom print.",
      cta: "Enter Darkroom",
      eyebrow: "04 — Darkroom Picks",
      hintLine1: "Weekly curation",
      hintLine2: "Editor recommended",
      titleLine1: "Let contrast and",
      titleLine2: "stay with you",
      titleAccent: "low light",
    },
    editorial: {
      cta: "View this week's picks",
      eyebrow: "03 — Editor Picks",
      hintLine1: "Story first",
      hintLine2: "Slow image viewing",
      titleAccent: "quiet frames",
      titleLine1: "Give room to",
      titleLine2: "",
    },
    footer: {
      madeWith: "Made with obsession",
      taglineLine1: "Every frame deserves to be seen.",
      taglineLine2: "Wallpaper is not decor. It is a point of view.",
    },
    hero: {
      badge: "Lumen Gallery is live",
      categoryFeatured: "Editor picks",
      categoryPopular: "Popular downloads",
      h1Line1: "Every frame",
      h1Line2: "deserves to be seen.",
      searchLabel: "Search wallpapers",
      searchPlaceholder: "Search nature, dark, city, space, minimal...",
      searchSubmit: "Search",
      shortcutDarkroom: "Darkroom",
      shortcutMotion: "Motion",
      shortcutUpload: "Upload",
      subtitle:
        "Lumen collects 4K still wallpapers, motion previews, creator work, and darkroom picks. Start with a keyword, then narrow by category, popularity, and curation.",
    },
    ios: {
      body: "Portrait works are selected first for lock screens and home screens, with higher-resolution covers so the mobile cards stay crisp.",
      cta: "Enter iOS picks",
      eyebrow: "02 — iOS Picks",
      hintLine1: "Portrait first",
      hintLine2: "Better for lock screens",
      noteBody:
        "This group balances time widgets, notifications, and subject spacing so wallpapers feel natural on iPhone and easy to save.",
      noteTitle: "iOS Curation Note",
      titleLine1: "Portrait picks",
      titleLine2: "for iPhone",
    },
    join: {
      body: "Upload photography, illustration, or AI work. Earn a revenue share on each download and join 3,200 creators.",
      drag: "Drag your work here",
      eyebrow: "Creator program",
      limit: "JPG · PNG · WEBP · max 50MB",
      metricCreators: "Active creators",
      metricRevenue: "Revenue share",
      metricWorks: "Curated works",
      titleLine1: "Share the",
      titleLine2: "world in your",
      titleAccent: "lens",
    },
    mood: {
      body: "Static wallpapers stay in focus while mood, characters, and color share one browsing rhythm.",
      cta: "Enter mood board",
      eyebrow: "01 · Mood Board",
      titleAccent: "mood",
      titlePrefix: "Find wallpapers by",
      titleSuffix: "",
    },
    search: {
      allTag: "All",
      body: "Keywords, categories, sorting, and curation filters are connected to Explore. Start with intent here, then refine in the full catalog.",
      categoryTitle: "Categories",
      eyebrow: "Discovery console",
      inputLabel: "Describe the scene you want",
      placeholder: "Example: quiet forest, dark desktop, blue minimal...",
      sortTitle: "Sort",
      submit: "Search catalog",
      title: "Turn browsing into controlled discovery.",
    },
  },
  ja: {
    category: {
      all: "すべて",
    },
    darkroom: {
      body: "夜色、ドラマチックな光、深い空気感を重視したセットです。軽さではなく、暗室プリントのような鑑賞体験を目指します。",
      cta: "暗室セレクトへ",
      eyebrow: "04 — 暗室セレクト",
      hintLine1: "週替わりキュレーション",
      hintLine2: "編集部おすすめ",
      titleLine1: "高いコントラストと",
      titleLine2: "を残す",
      titleAccent: "低照度",
    },
    editorial: {
      cta: "今週のおすすめを見る",
      eyebrow: "03 — 編集部おすすめ",
      hintLine1: "物語性を優先",
      hintLine2: "大きな画像をゆっくり",
      titleAccent: "余白を",
      titleLine1: "立ち止まりたい画面に",
      titleLine2: "",
    },
    footer: {
      madeWith: "Made with obsession",
      taglineLine1: "すべてのフレームには見られる価値がある。",
      taglineLine2: "壁紙は装飾ではなく、態度です。",
    },
    hero: {
      badge: "Lumen Gallery is live",
      categoryFeatured: "編集部おすすめ",
      categoryPopular: "人気ダウンロード",
      h1Line1: "すべてのフレームは、",
      h1Line2: "見られる価値がある。",
      searchLabel: "壁紙を検索",
      searchPlaceholder: "自然、ダーク、都市、宇宙、ミニマルを検索...",
      searchSubmit: "検索",
      shortcutDarkroom: "暗室",
      shortcutMotion: "モーション",
      shortcutUpload: "アップロード",
      subtitle:
        "Lumen は 4K 静止画、モーションプレビュー、クリエイター作品、暗室セレクトを収録しています。キーワードから始め、カテゴリや人気度で絞り込めます。",
    },
    ios: {
      body: "ロック画面とホーム画面に合う縦長作品を優先し、高解像度カバーでスマートフォン向けカードの鮮明さを保ちます。",
      cta: "iOS セレクトへ",
      eyebrow: "02 — iOS セレクト",
      hintLine1: "縦向きを優先",
      hintLine2: "ロック画面に最適",
      noteBody:
        "時刻ウィジェット、通知、主題の余白を考え、iPhone で自然に使える壁紙を集めています。",
      noteTitle: "iOS Curation Note",
      titleLine1: "iPhone のための",
      titleLine2: "縦向きセレクト",
    },
    join: {
      body: "写真、イラスト、AI 作品をアップロード。ダウンロードごとに収益分配を受け取り、3,200 人のクリエイターに加わりましょう。",
      drag: "作品をドラッグしてアップロード",
      eyebrow: "クリエイタープログラム",
      limit: "JPG · PNG · WEBP · 最大 50MB",
      metricCreators: "アクティブクリエイター",
      metricRevenue: "収益分配",
      metricWorks: "収録作品",
      titleLine1: "あなたの",
      titleLine2: "レンズの中の",
      titleAccent: "世界を共有",
    },
    mood: {
      body: "静止画の質感を保ちながら、ムード、キャラクター、色を同じリズムで眺められます。",
      cta: "ムードボードへ",
      eyebrow: "01 · ムードボード",
      titleAccent: "気分",
      titlePrefix: "",
      titleSuffix: "で壁紙を探す",
    },
    search: {
      allTag: "すべて",
      body: "キーワード、カテゴリ、並び替え、注目フィルターは探索ページに連携済みです。ここで意図を入力し、一覧でさらに絞り込めます。",
      categoryTitle: "カテゴリ",
      eyebrow: "Discovery console",
      inputLabel: "欲しい画面を説明",
      placeholder: "例：静かな森、暗いデスクトップ、青いミニマル...",
      sortTitle: "並び替え",
      submit: "カタログ検索",
      title: "気ままな閲覧を、制御できる探索へ。",
    },
  },
  ko: {
    category: {
      all: "전체",
    },
    darkroom: {
      body: "밤의 색, 극적인 빛, 더 깊은 분위기 밀도를 강조한 모음입니다. 가볍기보다 암실 인화처럼 천천히 보는 경험에 가깝습니다.",
      cta: "다크룸으로 이동",
      eyebrow: "04 — 다크룸 픽",
      hintLine1: "주간 큐레이션",
      hintLine2: "에디터 추천",
      titleLine1: "강한 대비와",
      titleLine2: "을 남기다",
      titleAccent: "낮은 조도",
    },
    editorial: {
      cta: "이번 주 추천 보기",
      eyebrow: "03 — 에디터 추천",
      hintLine1: "스토리 우선",
      hintLine2: "큰 이미지로 천천히",
      titleAccent: "여백을",
      titleLine1: "머물고 싶은 장면에",
      titleLine2: "",
    },
    footer: {
      madeWith: "Made with obsession",
      taglineLine1: "모든 프레임은 보여질 가치가 있습니다.",
      taglineLine2: "배경화면은 장식이 아니라 태도입니다.",
    },
    hero: {
      badge: "Lumen Gallery is live",
      categoryFeatured: "에디터 추천",
      categoryPopular: "인기 다운로드",
      h1Line1: "모든 프레임은",
      h1Line2: "보여질 가치가 있습니다.",
      searchLabel: "배경화면 검색",
      searchPlaceholder: "자연, 다크, 도시, 우주, 미니멀 검색...",
      searchSubmit: "검색",
      shortcutDarkroom: "다크룸",
      shortcutMotion: "모션",
      shortcutUpload: "업로드",
      subtitle:
        "Lumen은 4K 정적 배경화면, 모션 미리보기, 크리에이터 작품, 다크룸 픽을 모읍니다. 키워드로 시작해 카테고리와 인기순으로 좁혀보세요.",
    },
    ios: {
      body: "잠금 화면과 홈 화면에 어울리는 세로 작품을 우선 선택하고, 더 높은 해상도 커버로 모바일 카드의 선명함을 유지합니다.",
      cta: "iOS 픽 보기",
      eyebrow: "02 — iOS 픽",
      hintLine1: "세로 우선",
      hintLine2: "잠금 화면에 적합",
      noteBody:
        "시간 위젯, 알림, 피사체 여백의 균형을 고려해 iPhone에서 자연스럽게 저장해 쓰기 좋은 배경화면을 모았습니다.",
      noteTitle: "iOS Curation Note",
      titleLine1: "iPhone을 위한",
      titleLine2: "세로 추천",
    },
    join: {
      body: "사진, 일러스트, AI 작품을 업로드하세요. 다운로드마다 수익을 나누고 3,200명의 크리에이터와 함께하세요.",
      drag: "작품을 끌어 업로드",
      eyebrow: "크리에이터 프로그램",
      limit: "JPG · PNG · WEBP · 최대 50MB",
      metricCreators: "활성 크리에이터",
      metricRevenue: "수익 분배",
      metricWorks: "수록 작품",
      titleLine1: "당신의",
      titleLine2: "렌즈 속",
      titleAccent: "세계를 공유",
    },
    mood: {
      body: "정적 배경화면을 중심에 두고 분위기, 캐릭터, 색상을 하나의 탐색 리듬으로 묶었습니다.",
      cta: "무드 보드로 이동",
      eyebrow: "01 · 무드 보드",
      titleAccent: "기분",
      titlePrefix: "",
      titleSuffix: "으로 배경화면 찾기",
    },
    search: {
      allTag: "전체",
      body: "키워드, 카테고리, 정렬, 추천 상태가 탐색 페이지와 연결되어 있습니다. 여기에서 의도를 입력한 뒤 전체 카탈로그에서 더 좁혀보세요.",
      categoryTitle: "카테고리",
      eyebrow: "Discovery console",
      inputLabel: "원하는 장면 설명",
      placeholder: "예: 조용한 숲, 어두운 데스크톱, 파란 미니멀...",
      sortTitle: "정렬",
      submit: "카탈로그 검색",
      title: "그냥 둘러보기를 통제 가능한 탐색으로.",
    },
  },
} satisfies Record<SupportedLocale, HomeUiCopy>;

const EXPLORE_UI_COPY = {
  "zh-CN": {
    allCategories: "全部分类",
    allDirectory: "探索整本目录",
    allFilters: "全目录",
    allTag: "全部",
    clearAll: "清空全部",
    clearCategory: "清除分类",
    clearFeatured: "取消精选过滤",
    clearKeyword: "清除关键词",
    clearTag: "清除标签",
    currentFilters: "当前筛选",
    defaultDescription:
      "按关键词、标签、分类、动态壁纸和热度筛选壁纸目录。结果优先读取真实数据，并兼容 AI 标签与人工标签。",
    emptyBody: "换一个关键词或清空筛选条件",
    emptyTitle: "没有命中的作品",
    errorTitle: "探索目录暂时失联",
    featuredOff: "仅看精选",
    featuredOn: "精选开启",
    loadingError: "探索目录加载失败。",
    motionMixed: "静态与动态混合",
    motionOff: "仅看 Motion",
    motionOn: "Motion 开启",
    motionOnly: "动态壁纸",
    nextPage: "下一页 →",
    pageCount: ({ page, total, totalPages }) =>
      `共 ${total} 件 · 第 ${page}/${totalPages} 页`,
    pageSize: ({ count, pageSize }) => `本页 ${count} 件 · 每页 ${pageSize} 件`,
    popularTags: "热门标签",
    previousPage: "← 上一页",
    searchPlaceholder: "搜索标题、描述、AI 标签或创作者…",
    searchSubmit: "搜索目录",
    sortLabel: "排序",
    tagPlaceholder: "标签，如 自然 / 赛博 / 晨雾",
    topicTags: [
      "户外",
      "自然风景",
      "海边",
      "蓝天",
      "夏日",
      "唯美",
      "清新",
      "人像",
      "城市",
      "极简",
      "暗夜",
      "宇宙",
      "霓虹",
      "渐变",
      "像素",
    ],
  },
  en: {
    allCategories: "All categories",
    allDirectory: "Explore the full catalog",
    allFilters: "Full catalog",
    allTag: "All",
    clearAll: "Clear all",
    clearCategory: "Clear category",
    clearFeatured: "Remove featured filter",
    clearKeyword: "Clear keyword",
    clearTag: "Clear tag",
    currentFilters: "Current filters",
    defaultDescription:
      "Filter wallpapers by keyword, tag, category, motion, and popularity. Results use live data and support both AI and manual tags.",
    emptyBody: "Try another keyword or clear your filters.",
    emptyTitle: "No matching works",
    errorTitle: "Explore is temporarily unavailable",
    featuredOff: "Featured only",
    featuredOn: "Featured on",
    loadingError: "Failed to load the explore catalog.",
    motionMixed: "Static and motion mixed",
    motionOff: "Motion only",
    motionOn: "Motion on",
    motionOnly: "Motion wallpapers",
    nextPage: "Next →",
    pageCount: ({ page, total, totalPages }) =>
      `${total} works · page ${page}/${totalPages}`,
    pageSize: ({ count, pageSize }) =>
      `${count} on this page · ${pageSize} per page`,
    popularTags: "Popular tags",
    previousPage: "← Previous",
    searchPlaceholder: "Search titles, descriptions, AI tags, or creators...",
    searchSubmit: "Search catalog",
    sortLabel: "Sort",
    tagPlaceholder: "Tags like nature / cyber / mist",
    topicTags: [
      "outdoor",
      "nature",
      "seaside",
      "blue sky",
      "summer",
      "aesthetic",
      "fresh",
      "portrait",
      "city",
      "minimal",
      "night",
      "space",
      "neon",
      "gradient",
      "pixel",
    ],
  },
  ja: {
    allCategories: "すべてのカテゴリ",
    allDirectory: "カタログ全体を探索",
    allFilters: "全カタログ",
    allTag: "すべて",
    clearAll: "すべてクリア",
    clearCategory: "カテゴリをクリア",
    clearFeatured: "注目フィルターを解除",
    clearKeyword: "キーワードをクリア",
    clearTag: "タグをクリア",
    currentFilters: "現在のフィルター",
    defaultDescription:
      "キーワード、タグ、カテゴリ、モーション、人気度で壁紙を絞り込めます。結果は実データを優先し、AI タグと手動タグに対応します。",
    emptyBody: "別のキーワードを試すか、フィルターをクリアしてください。",
    emptyTitle: "該当する作品がありません",
    errorTitle: "探索カタログに一時的に接続できません",
    featuredOff: "注目のみ",
    featuredOn: "注目オン",
    loadingError: "探索カタログの読み込みに失敗しました。",
    motionMixed: "静止画とモーション",
    motionOff: "Motion のみ",
    motionOn: "Motion オン",
    motionOnly: "モーション壁紙",
    nextPage: "次へ →",
    pageCount: ({ page, total, totalPages }) =>
      `${total} 件 · ${page}/${totalPages} ページ`,
    pageSize: ({ count, pageSize }) =>
      `このページ ${count} 件 · 1ページ ${pageSize} 件`,
    popularTags: "人気タグ",
    previousPage: "← 前へ",
    searchPlaceholder: "タイトル、説明、AI タグ、クリエイターを検索...",
    searchSubmit: "カタログ検索",
    sortLabel: "並び替え",
    tagPlaceholder: "タグ例：自然 / サイバー / 朝霧",
    topicTags: [
      "アウトドア",
      "自然",
      "海辺",
      "青空",
      "夏",
      "美しい",
      "爽やか",
      "ポートレート",
      "都市",
      "ミニマル",
      "夜",
      "宇宙",
      "ネオン",
      "グラデーション",
      "ピクセル",
    ],
  },
  ko: {
    allCategories: "전체 카테고리",
    allDirectory: "전체 카탈로그 탐색",
    allFilters: "전체 카탈로그",
    allTag: "전체",
    clearAll: "모두 지우기",
    clearCategory: "카테고리 지우기",
    clearFeatured: "추천 필터 해제",
    clearKeyword: "키워드 지우기",
    clearTag: "태그 지우기",
    currentFilters: "현재 필터",
    defaultDescription:
      "키워드, 태그, 카테고리, 모션, 인기순으로 배경화면을 필터링합니다. 결과는 실제 데이터를 우선하며 AI 태그와 수동 태그를 함께 지원합니다.",
    emptyBody: "다른 키워드를 시도하거나 필터를 지워보세요.",
    emptyTitle: "일치하는 작품이 없습니다",
    errorTitle: "탐색 카탈로그에 잠시 연결할 수 없습니다",
    featuredOff: "추천만 보기",
    featuredOn: "추천 켜짐",
    loadingError: "탐색 카탈로그를 불러오지 못했습니다.",
    motionMixed: "정적과 모션 혼합",
    motionOff: "Motion만 보기",
    motionOn: "Motion 켜짐",
    motionOnly: "모션 배경화면",
    nextPage: "다음 →",
    pageCount: ({ page, total, totalPages }) =>
      `총 ${total}개 · ${page}/${totalPages}페이지`,
    pageSize: ({ count, pageSize }) =>
      `현재 ${count}개 · 페이지당 ${pageSize}개`,
    popularTags: "인기 태그",
    previousPage: "← 이전",
    searchPlaceholder: "제목, 설명, AI 태그 또는 크리에이터 검색...",
    searchSubmit: "카탈로그 검색",
    sortLabel: "정렬",
    tagPlaceholder: "태그 예: 자연 / 사이버 / 안개",
    topicTags: [
      "야외",
      "자연",
      "바닷가",
      "파란 하늘",
      "여름",
      "감성",
      "산뜻함",
      "인물",
      "도시",
      "미니멀",
      "밤",
      "우주",
      "네온",
      "그라데이션",
      "픽셀",
    ],
  },
} satisfies Record<SupportedLocale, ExploreUiCopy>;

const DARKROOM_PAGE_COPY = {
  "zh-CN": {
    count: (count) => `当前精选 ${count}`,
    description:
      "这里优先汇集更具情绪密度、视觉张力和下载热度的作品。当前精选会直接读取已标记 `featured` 的壁纸，并按热度排序。",
    empty:
      "还没有任何精选作品。你可以先在管理台把一张作品标记为 featured，这里就会自动出现。",
    metricCurated: "Curated by editor flag",
    sort: "排序依据：下载热度",
    title: "编辑挑出的暗室精选",
  },
  en: {
    count: (count) => `${count} current picks`,
    description:
      "This page gathers work with stronger mood, visual tension, and download momentum. Featured wallpapers are read from the editor flag and sorted by popularity.",
    empty:
      "No featured works yet. Mark a wallpaper as featured in the dashboard and it will appear here automatically.",
    metricCurated: "Curated by editor flag",
    sort: "Sorted by downloads",
    title: "Darkroom picks from the editors",
  },
  ja: {
    count: (count) => `現在のセレクト ${count} 件`,
    description:
      "より濃いムード、視覚的な強さ、ダウンロード熱度を持つ作品を集めています。編集部が featured にした壁紙を人気順で表示します。",
    empty:
      "まだ注目作品がありません。管理画面で壁紙を featured にすると、ここに自動で表示されます。",
    metricCurated: "編集フラグでキュレーション",
    sort: "並び替え：ダウンロード順",
    title: "編集部が選ぶ暗室セレクト",
  },
  ko: {
    count: (count) => `현재 추천 ${count}개`,
    description:
      "더 짙은 분위기, 시각적 긴장감, 다운로드 열도가 있는 작품을 모읍니다. 에디터가 featured로 표시한 배경화면을 인기순으로 보여줍니다.",
    empty:
      "아직 추천 작품이 없습니다. 관리 화면에서 배경화면을 featured로 표시하면 자동으로 여기에 나타납니다.",
    metricCurated: "에디터 플래그로 큐레이션",
    sort: "정렬 기준: 다운로드순",
    title: "에디터가 고른 다크룸 픽",
  },
} satisfies Record<SupportedLocale, DarkroomPageCopy>;

const WALLPAPER_PAGE_COPY = {
  "zh-CN": {
    all: "查看全部 ↗",
    detailEyebrow: "Wallpaper Detail",
    moreTag: (tag) => `更多 #${tag}`,
    notFoundTitle: "壁纸未找到",
    relatedHeading: "你可能也喜欢",
    relatedPopular: "热门推荐",
    seoFallback: ({ tagLine, title }) =>
      `${title} · ${tagLine} · 来自 Lumen 的高质感壁纸详情页。`,
  },
  en: {
    all: "View all ↗",
    detailEyebrow: "Wallpaper Detail",
    moreTag: (tag) => `More #${tag}`,
    notFoundTitle: "Wallpaper not found",
    relatedHeading: "You might also like",
    relatedPopular: "Popular recommendations",
    seoFallback: ({ tagLine, title }) =>
      `${title} · ${tagLine} · a high-quality wallpaper detail page from Lumen.`,
  },
  ja: {
    all: "すべて見る ↗",
    detailEyebrow: "Wallpaper Detail",
    moreTag: (tag) => `もっと見る #${tag}`,
    notFoundTitle: "壁紙が見つかりません",
    relatedHeading: "こちらもおすすめ",
    relatedPopular: "人気のおすすめ",
    seoFallback: ({ tagLine, title }) =>
      `${title} · ${tagLine} · Lumen の高品質な壁紙詳細ページです。`,
  },
  ko: {
    all: "전체 보기 ↗",
    detailEyebrow: "Wallpaper Detail",
    moreTag: (tag) => `더 보기 #${tag}`,
    notFoundTitle: "배경화면을 찾을 수 없습니다",
    relatedHeading: "이런 작품도 좋아할 수 있어요",
    relatedPopular: "인기 추천",
    seoFallback: ({ tagLine, title }) =>
      `${title} · ${tagLine} · Lumen의 고품질 배경화면 상세 페이지입니다.`,
  },
} satisfies Record<SupportedLocale, WallpaperPageCopy>;

const LOCALIZED_HOME_DATA_COPY = {
  "zh-CN": {
    categories: {
      nature: "自然风光",
      space: "宇宙星系",
      abstract: "抽象艺术",
      minimal: "极简主义",
      city: "城市夜景",
      illustration: "插画二次元",
      dark: "暗色系",
    },
    footerColumns: {
      about: "关于",
      creator: "创作者",
      explore: "探索",
    },
    footerLinks: {
      mood: "情绪版",
      darkroom: "暗室精选",
      popular: "热门排行",
      random: "随机发现",
      upload: "上传作品",
      revenue: "收益计划",
      copyright: "版权保护",
      guide: "创作者指南",
      about: "关于 Lumen",
      privacy: "隐私政策",
      terms: "使用条款",
      contact: "联系我们",
    },
    nav: {
      creator: "创作者",
      darkroom: "暗室精选",
      explore: "探索",
      library: "4K 库",
    },
    searchTags: {
      all: "全部",
      night: "暗夜",
      minimal: "极简",
      gradient: "渐变",
      nature: "自然",
      space: "宇宙",
      city: "城市",
      abstract: "抽象",
      japanese: "日系",
      cyber: "赛博",
      ai: "AI 生成",
    },
    stats: {
      creators: "创作者",
      monthlyUsers: "月活用户",
      wallpapers: "精选壁纸",
    },
    ticker: {
      latest: "最新上传",
      k4: "4K 超清",
      nature: "自然风光",
      trending: "本周热榜",
      minimal: "极简主义",
      ai: "AI 生成艺术",
      space: "宇宙星系",
      cyberpunk: "赛博朋克",
      photographer: "摄影师作品",
      dark: "暗色系",
    },
  },
  en: {
    categories: {
      nature: "Nature",
      space: "Space",
      abstract: "Abstract",
      minimal: "Minimal",
      city: "City Nights",
      illustration: "Illustration",
      dark: "Dark",
    },
    footerColumns: {
      about: "About",
      creator: "Creators",
      explore: "Explore",
    },
    footerLinks: {
      mood: "Mood Board",
      darkroom: "Darkroom Picks",
      popular: "Popular",
      random: "Random Discovery",
      upload: "Upload Work",
      revenue: "Revenue Program",
      copyright: "Copyright Protection",
      guide: "Creator Guide",
      about: "About Lumen",
      privacy: "Privacy Policy",
      terms: "Terms",
      contact: "Contact",
    },
    nav: {
      creator: "Creators",
      darkroom: "Darkroom",
      explore: "Explore",
      library: "4K Library",
    },
    searchTags: {
      all: "All",
      night: "Night",
      minimal: "Minimal",
      gradient: "Gradient",
      nature: "Nature",
      space: "Space",
      city: "City",
      abstract: "Abstract",
      japanese: "Japan",
      cyber: "Cyber",
      ai: "AI Generated",
    },
    stats: {
      creators: "Creators",
      monthlyUsers: "Monthly users",
      wallpapers: "Featured wallpapers",
    },
    ticker: {
      latest: "Latest uploads",
      k4: "4K Ultra HD",
      nature: "Nature",
      trending: "Trending this week",
      minimal: "Minimal",
      ai: "AI Art",
      space: "Space",
      cyberpunk: "Cyberpunk",
      photographer: "Photographer works",
      dark: "Dark",
    },
  },
  ja: {
    categories: {
      nature: "自然風景",
      space: "宇宙",
      abstract: "抽象アート",
      minimal: "ミニマル",
      city: "都市の夜景",
      illustration: "イラスト",
      dark: "ダーク",
    },
    footerColumns: {
      about: "概要",
      creator: "クリエイター",
      explore: "探索",
    },
    footerLinks: {
      mood: "ムードボード",
      darkroom: "暗室セレクト",
      popular: "人気ランキング",
      random: "ランダム発見",
      upload: "作品をアップロード",
      revenue: "収益プログラム",
      copyright: "著作権保護",
      guide: "クリエイターガイド",
      about: "Lumen について",
      privacy: "プライバシーポリシー",
      terms: "利用規約",
      contact: "お問い合わせ",
    },
    nav: {
      creator: "クリエイター",
      darkroom: "暗室セレクト",
      explore: "探索",
      library: "4K ライブラリ",
    },
    searchTags: {
      all: "すべて",
      night: "夜",
      minimal: "ミニマル",
      gradient: "グラデーション",
      nature: "自然",
      space: "宇宙",
      city: "都市",
      abstract: "抽象",
      japanese: "日本風",
      cyber: "サイバー",
      ai: "AI 生成",
    },
    stats: {
      creators: "クリエイター",
      monthlyUsers: "月間ユーザー",
      wallpapers: "注目の壁紙",
    },
    ticker: {
      latest: "新着アップロード",
      k4: "4K Ultra HD",
      nature: "自然風景",
      trending: "今週の人気",
      minimal: "ミニマル",
      ai: "AI アート",
      space: "宇宙",
      cyberpunk: "サイバーパンク",
      photographer: "写真家の作品",
      dark: "ダーク",
    },
  },
  ko: {
    categories: {
      nature: "자연 풍경",
      space: "우주",
      abstract: "추상 아트",
      minimal: "미니멀",
      city: "도시 야경",
      illustration: "일러스트",
      dark: "다크",
    },
    footerColumns: {
      about: "소개",
      creator: "크리에이터",
      explore: "탐색",
    },
    footerLinks: {
      mood: "무드 보드",
      darkroom: "다크룸 픽",
      popular: "인기 순위",
      random: "랜덤 발견",
      upload: "작품 업로드",
      revenue: "수익 프로그램",
      copyright: "저작권 보호",
      guide: "크리에이터 가이드",
      about: "Lumen 소개",
      privacy: "개인정보 처리방침",
      terms: "이용 약관",
      contact: "문의하기",
    },
    nav: {
      creator: "크리에이터",
      darkroom: "다크룸",
      explore: "탐색",
      library: "4K 라이브러리",
    },
    searchTags: {
      all: "전체",
      night: "밤",
      minimal: "미니멀",
      gradient: "그라데이션",
      nature: "자연",
      space: "우주",
      city: "도시",
      abstract: "추상",
      japanese: "일본풍",
      cyber: "사이버",
      ai: "AI 생성",
    },
    stats: {
      creators: "크리에이터",
      monthlyUsers: "월간 사용자",
      wallpapers: "추천 배경화면",
    },
    ticker: {
      latest: "최신 업로드",
      k4: "4K Ultra HD",
      nature: "자연 풍경",
      trending: "이번 주 인기",
      minimal: "미니멀",
      ai: "AI 아트",
      space: "우주",
      cyberpunk: "사이버펑크",
      photographer: "사진가 작품",
      dark: "다크",
    },
  },
} satisfies Record<SupportedLocale, LocalizedHomeDataCopy>;

export function getHomeUiCopy(locale: SupportedLocale) {
  return HOME_UI_COPY[locale];
}

export function getExploreUiCopy(locale: SupportedLocale) {
  return EXPLORE_UI_COPY[locale];
}

export function getDarkroomPageCopy(locale: SupportedLocale) {
  return DARKROOM_PAGE_COPY[locale];
}

export function getWallpaperPageCopy(locale: SupportedLocale) {
  return WALLPAPER_PAGE_COPY[locale];
}

export function getLocalizedHomeDataCopy(locale: SupportedLocale) {
  return LOCALIZED_HOME_DATA_COPY[locale];
}
