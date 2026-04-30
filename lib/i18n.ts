import type {
  I18nMessages,
  LocaleOption,
  LocalizedSiteMetadata,
  SupportedLocale,
} from "@/types/i18n";

export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_COOKIE_NAME = "lumen_locale";
export const LOCALE_REQUEST_HEADER = "x-lumen-locale";

export const SUPPORTED_LOCALES = [
  "zh-CN",
  "en",
  "ja",
  "ko",
] as const satisfies readonly SupportedLocale[];

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

export const LOCALE_OPTIONS: LocaleOption[] = [
  {
    htmlLang: "zh-CN",
    label: "Chinese",
    locale: "zh-CN",
    nativeLabel: "简体中文",
  },
  {
    htmlLang: "en",
    label: "English",
    locale: "en",
    nativeLabel: "English",
  },
  {
    htmlLang: "ja",
    label: "Japanese",
    locale: "ja",
    nativeLabel: "日本語",
  },
  {
    htmlLang: "ko",
    label: "Korean",
    locale: "ko",
    nativeLabel: "한국어",
  },
];

const SITE_METADATA = {
  "zh-CN": {
    title: "Lumen",
    description:
      "Lumen 是一个以胶卷美学与高端杂志排版为语言的壁纸发现与分享平台。",
  },
  en: {
    title: "Lumen",
    description:
      "Lumen is a film-inspired wallpaper discovery and sharing platform with an editorial visual language.",
  },
  ja: {
    title: "Lumen",
    description:
      "Lumen はフィルムの美学とエディトリアルな表現で壁紙を発見・共有できるプラットフォームです。",
  },
  ko: {
    title: "Lumen",
    description:
      "Lumen은 필름 미학과 매거진 스타일의 언어로 배경화면을 발견하고 공유하는 플랫폼입니다.",
  },
} satisfies Record<SupportedLocale, LocalizedSiteMetadata>;

const MESSAGES = {
  "zh-CN": {
    actions: {
      close: "关闭",
      download: "下载",
      explore: "探索",
      retry: "重试",
      save: "保存",
      search: "搜索",
      upload: "上传",
    },
    common: {
      brandDescription: SITE_METADATA["zh-CN"].description,
      brandName: "Lumen",
      language: "语言",
    },
    explore: {
      categories: {
        nature: {
          label: "自然风光",
          description: "山谷、森林、湖海与雾气，适合安静又有呼吸感的桌面。",
        },
        space: {
          label: "宇宙星系",
          description: "星云、银河与深空影像，适合更沉浸的暗调桌面。",
        },
        abstract: {
          label: "抽象艺术",
          description: "流动渐变、材质肌理与极具图形感的实验画面。",
        },
        minimal: {
          label: "极简主义",
          description: "低信息密度、高留白的干净构图，适合作为工作桌面背景。",
        },
        city: {
          label: "城市夜景",
          description: "摩天楼、霓虹街区和午夜高架，让桌面更有速度感。",
        },
        illustration: {
          label: "插画二次元",
          description: "插画、角色与二次元构图，适合更鲜明的个人风格。",
        },
        dark: {
          label: "暗色系",
          description: "低亮度、重氛围、电影感更强的深色壁纸集合。",
        },
      },
      filters: {
        aspect: {
          desktop: {
            label: "桌面",
            description: "16:9、16:10、21:9 等横向桌面比例",
          },
          phone: {
            label: "手机",
            description: "9:16、9:19.5、3:4 等竖向手机比例",
          },
          tablet: {
            label: "平板",
            description: "4:3、3:4、接近方形的阅读设备比例",
          },
          ultrawide: {
            label: "带鱼屏",
            description: "21:9 及以上的超宽桌面比例",
          },
          square: {
            label: "方图",
            description: "接近 1:1 的头像、封面和社媒比例",
          },
        },
        media: {
          all: { label: "全部" },
          static: { label: "静态" },
          motion: { label: "动态" },
        },
        orientation: {
          landscape: { label: "横屏" },
          portrait: { label: "竖屏" },
          square: { label: "方图" },
        },
        resolution: {
          "1080p": { label: "1080P+", description: "至少满足 Full HD 级别" },
          "2k": { label: "2K+", description: "适合 1440P 屏幕" },
          "4k": { label: "4K+", description: "适合 4K 桌面或高密度屏幕" },
          "5k": { label: "5K+", description: "更高分辨率素材" },
          "8k": { label: "8K+", description: "超高分辨率素材" },
        },
        sort: {
          latest: { label: "最新", description: "优先显示最近发布的作品" },
          popular: { label: "下载热度", description: "按下载数排序" },
          likes: { label: "收藏热度", description: "按收藏数排序" },
        },
      },
    },
    footer: {
      about: "关于",
      creator: "创作者",
      explore: "探索",
    },
    home: {
      darkroom: "暗室精选",
      featuredWallpapers: "精选壁纸",
      navCreator: "创作者",
      navDarkroom: "暗室精选",
      navExplore: "探索",
      navLibrary: "4K 库",
    },
    wallpaper: {
      bestThisWeek: "本周最佳",
      curated: "精选壁纸",
      curatedShort: "精选",
      downloads: "次下载",
      editorPick: "编辑推荐",
      editorPickThisWeek: "编辑推荐 · 本周",
      hd: "高清",
      motionWallpaper: "动态壁纸",
      seoDescriptionFallback: "来自 Lumen 的 4K 高清壁纸。",
      seoTitleSuffix: "Lumen 高清壁纸",
      staticWallpaper: "静态壁纸",
    },
  },
  en: {
    actions: {
      close: "Close",
      download: "Download",
      explore: "Explore",
      retry: "Retry",
      save: "Save",
      search: "Search",
      upload: "Upload",
    },
    common: {
      brandDescription: SITE_METADATA.en.description,
      brandName: "Lumen",
      language: "Language",
    },
    explore: {
      categories: {
        nature: {
          label: "Nature",
          description:
            "Valleys, forests, water, and mist for calm desktops with room to breathe.",
        },
        space: {
          label: "Space",
          description:
            "Nebulae, galaxies, and deep-space imagery for immersive dark setups.",
        },
        abstract: {
          label: "Abstract",
          description:
            "Fluid gradients, tactile materials, and graphic experimental scenes.",
        },
        minimal: {
          label: "Minimal",
          description:
            "Clean compositions with low visual noise and generous negative space.",
        },
        city: {
          label: "City Nights",
          description:
            "Skylines, neon streets, and midnight overpasses with a sharper pace.",
        },
        illustration: {
          label: "Illustration",
          description:
            "Illustrated scenes, characters, and anime-inspired compositions.",
        },
        dark: {
          label: "Dark",
          description:
            "Low-light, atmospheric wallpapers with a stronger cinematic mood.",
        },
      },
      filters: {
        aspect: {
          desktop: {
            label: "Desktop",
            description: "Landscape ratios such as 16:9, 16:10, and 21:9.",
          },
          phone: {
            label: "Phone",
            description: "Portrait ratios such as 9:16, 9:19.5, and 3:4.",
          },
          tablet: {
            label: "Tablet",
            description: "4:3, 3:4, and near-square reading device ratios.",
          },
          ultrawide: {
            label: "Ultrawide",
            description: "Wide desktop ratios at 21:9 and above.",
          },
          square: {
            label: "Square",
            description:
              "Near 1:1 imagery for avatars, covers, and social use.",
          },
        },
        media: {
          all: { label: "All" },
          static: { label: "Static" },
          motion: { label: "Motion" },
        },
        orientation: {
          landscape: { label: "Landscape" },
          portrait: { label: "Portrait" },
          square: { label: "Square" },
        },
        resolution: {
          "1080p": { label: "1080P+", description: "At least Full HD." },
          "2k": { label: "2K+", description: "Suited for 1440P screens." },
          "4k": {
            label: "4K+",
            description: "For 4K desktops or dense displays.",
          },
          "5k": {
            label: "5K+",
            description: "Higher-resolution source files.",
          },
          "8k": {
            label: "8K+",
            description: "Ultra-high-resolution source files.",
          },
        },
        sort: {
          latest: {
            label: "Latest",
            description: "Show recently published work first.",
          },
          popular: {
            label: "Downloads",
            description: "Sort by download count.",
          },
          likes: { label: "Favorites", description: "Sort by favorite count." },
        },
      },
    },
    footer: {
      about: "About",
      creator: "Creators",
      explore: "Explore",
    },
    home: {
      darkroom: "Darkroom Picks",
      featuredWallpapers: "Featured wallpapers",
      navCreator: "Creators",
      navDarkroom: "Darkroom",
      navExplore: "Explore",
      navLibrary: "4K Library",
    },
    wallpaper: {
      bestThisWeek: "Best this week",
      curated: "Curated wallpaper",
      curatedShort: "Curated",
      downloads: "downloads",
      editorPick: "Editor pick",
      editorPickThisWeek: "Editor pick · This week",
      hd: "HD",
      motionWallpaper: "Motion wallpaper",
      seoDescriptionFallback: "A 4K HD wallpaper from Lumen.",
      seoTitleSuffix: "Lumen HD Wallpaper",
      staticWallpaper: "Static wallpaper",
    },
  },
  ja: {
    actions: {
      close: "閉じる",
      download: "ダウンロード",
      explore: "探索",
      retry: "再試行",
      save: "保存",
      search: "検索",
      upload: "アップロード",
    },
    common: {
      brandDescription: SITE_METADATA.ja.description,
      brandName: "Lumen",
      language: "言語",
    },
    explore: {
      categories: {
        nature: {
          label: "自然風景",
          description: "谷、森、水辺、霧。静かで余白のあるデスクトップに。",
        },
        space: {
          label: "宇宙",
          description:
            "星雲、銀河、深宇宙のイメージ。没入感のある暗めの画面に。",
        },
        abstract: {
          label: "抽象アート",
          description:
            "流れるグラデーション、質感、実験的でグラフィカルな画面。",
        },
        minimal: {
          label: "ミニマル",
          description: "情報量を抑え、余白を活かしたクリーンな構図。",
        },
        city: {
          label: "都市の夜景",
          description:
            "高層ビル、ネオン街、深夜の高架。スピード感のある画面に。",
        },
        illustration: {
          label: "イラスト",
          description: "イラスト、キャラクター、アニメ調の構図。",
        },
        dark: {
          label: "ダーク",
          description: "低照度で雰囲気の濃い、映画的な壁紙コレクション。",
        },
      },
      filters: {
        aspect: {
          desktop: {
            label: "デスクトップ",
            description: "16:9、16:10、21:9 などの横長比率。",
          },
          phone: {
            label: "スマートフォン",
            description: "9:16、9:19.5、3:4 などの縦長比率。",
          },
          tablet: {
            label: "タブレット",
            description: "4:3、3:4、正方形に近い読書端末向け比率。",
          },
          ultrawide: {
            label: "ウルトラワイド",
            description: "21:9 以上の超横長デスクトップ比率。",
          },
          square: {
            label: "正方形",
            description: "アバター、カバー、SNS 向けの 1:1 に近い画像。",
          },
        },
        media: {
          all: { label: "すべて" },
          static: { label: "静止画" },
          motion: { label: "モーション" },
        },
        orientation: {
          landscape: { label: "横向き" },
          portrait: { label: "縦向き" },
          square: { label: "正方形" },
        },
        resolution: {
          "1080p": { label: "1080P+", description: "Full HD 以上。" },
          "2k": { label: "2K+", description: "1440P 画面に適しています。" },
          "4k": {
            label: "4K+",
            description: "4K デスクトップや高密度画面向け。",
          },
          "5k": { label: "5K+", description: "さらに高解像度の素材。" },
          "8k": { label: "8K+", description: "超高解像度の素材。" },
        },
        sort: {
          latest: {
            label: "新着",
            description: "最近公開された作品を優先します。",
          },
          popular: {
            label: "ダウンロード順",
            description: "ダウンロード数で並べ替えます。",
          },
          likes: {
            label: "お気に入り順",
            description: "お気に入り数で並べ替えます。",
          },
        },
      },
    },
    footer: {
      about: "概要",
      creator: "クリエイター",
      explore: "探索",
    },
    home: {
      darkroom: "暗室セレクト",
      featuredWallpapers: "注目の壁紙",
      navCreator: "クリエイター",
      navDarkroom: "暗室セレクト",
      navExplore: "探索",
      navLibrary: "4K ライブラリ",
    },
    wallpaper: {
      bestThisWeek: "今週のベスト",
      curated: "厳選壁紙",
      curatedShort: "厳選",
      downloads: "ダウンロード",
      editorPick: "編集部おすすめ",
      editorPickThisWeek: "編集部おすすめ · 今週",
      hd: "HD",
      motionWallpaper: "モーション壁紙",
      seoDescriptionFallback: "Lumen の 4K HD 壁紙です。",
      seoTitleSuffix: "Lumen HD 壁紙",
      staticWallpaper: "静止画壁紙",
    },
  },
  ko: {
    actions: {
      close: "닫기",
      download: "다운로드",
      explore: "탐색",
      retry: "다시 시도",
      save: "저장",
      search: "검색",
      upload: "업로드",
    },
    common: {
      brandDescription: SITE_METADATA.ko.description,
      brandName: "Lumen",
      language: "언어",
    },
    explore: {
      categories: {
        nature: {
          label: "자연 풍경",
          description:
            "계곡, 숲, 물가와 안개. 차분하고 숨 쉴 공간이 있는 화면에 어울립니다.",
        },
        space: {
          label: "우주",
          description:
            "성운, 은하, 심우주 이미지. 몰입감 있는 어두운 데스크톱에 적합합니다.",
        },
        abstract: {
          label: "추상 아트",
          description: "흐르는 그라데이션, 질감, 그래픽한 실험적 장면.",
        },
        minimal: {
          label: "미니멀",
          description: "정보량을 낮추고 여백을 살린 깨끗한 구도.",
        },
        city: {
          label: "도시 야경",
          description: "스카이라인, 네온 거리, 한밤의 고가도로가 주는 속도감.",
        },
        illustration: {
          label: "일러스트",
          description: "일러스트, 캐릭터, 애니메이션 감성의 구성.",
        },
        dark: {
          label: "다크",
          description: "낮은 밝기와 짙은 분위기의 영화적인 배경화면 모음.",
        },
      },
      filters: {
        aspect: {
          desktop: {
            label: "데스크톱",
            description: "16:9, 16:10, 21:9 같은 가로형 비율.",
          },
          phone: {
            label: "휴대폰",
            description: "9:16, 9:19.5, 3:4 같은 세로형 비율.",
          },
          tablet: {
            label: "태블릿",
            description: "4:3, 3:4, 정사각형에 가까운 독서 기기 비율.",
          },
          ultrawide: {
            label: "울트라와이드",
            description: "21:9 이상의 초광폭 데스크톱 비율.",
          },
          square: {
            label: "정사각형",
            description: "아바타, 커버, 소셜용에 적합한 1:1 근접 이미지.",
          },
        },
        media: {
          all: { label: "전체" },
          static: { label: "정적" },
          motion: { label: "모션" },
        },
        orientation: {
          landscape: { label: "가로" },
          portrait: { label: "세로" },
          square: { label: "정사각형" },
        },
        resolution: {
          "1080p": { label: "1080P+", description: "Full HD 이상." },
          "2k": { label: "2K+", description: "1440P 화면에 적합합니다." },
          "4k": {
            label: "4K+",
            description: "4K 데스크톱 또는 고밀도 화면용.",
          },
          "5k": { label: "5K+", description: "더 높은 해상도의 원본." },
          "8k": { label: "8K+", description: "초고해상도 원본." },
        },
        sort: {
          latest: {
            label: "최신",
            description: "최근 공개된 작품을 먼저 표시합니다.",
          },
          popular: {
            label: "다운로드순",
            description: "다운로드 수로 정렬합니다.",
          },
          likes: {
            label: "즐겨찾기순",
            description: "즐겨찾기 수로 정렬합니다.",
          },
        },
      },
    },
    footer: {
      about: "소개",
      creator: "크리에이터",
      explore: "탐색",
    },
    home: {
      darkroom: "다크룸 픽",
      featuredWallpapers: "추천 배경화면",
      navCreator: "크리에이터",
      navDarkroom: "다크룸",
      navExplore: "탐색",
      navLibrary: "4K 라이브러리",
    },
    wallpaper: {
      bestThisWeek: "이번 주 베스트",
      curated: "큐레이션 배경화면",
      curatedShort: "큐레이션",
      downloads: "다운로드",
      editorPick: "에디터 추천",
      editorPickThisWeek: "에디터 추천 · 이번 주",
      hd: "HD",
      motionWallpaper: "모션 배경화면",
      seoDescriptionFallback: "Lumen의 4K HD 배경화면입니다.",
      seoTitleSuffix: "Lumen HD 배경화면",
      staticWallpaper: "정적 배경화면",
    },
  },
} satisfies Record<SupportedLocale, I18nMessages>;

const STATIC_TERM_TRANSLATIONS: Record<
  string,
  Partial<Record<SupportedLocale, string>>
> = {
  "4K 库": { en: "4K Library", ja: "4K ライブラリ", ko: "4K 라이브러리" },
  "AI 生成": { en: "AI Generated", ja: "AI 生成", ko: "AI 생성" },
  "AI 生成艺术": { en: "AI Art", ja: "AI アート", ko: "AI 아트" },
  关于: { en: "About", ja: "概要", ko: "소개" },
  "关于 Lumen": { en: "About Lumen", ja: "Lumen について", ko: "Lumen 소개" },
  冰川之蓝: { en: "Glacier Blue", ja: "氷河のブルー", ko: "빙하의 푸른빛" },
  创作者: { en: "Creators", ja: "クリエイター", ko: "크리에이터" },
  创作者指南: {
    en: "Creator Guide",
    ja: "クリエイターガイド",
    ko: "크리에이터 가이드",
  },
  收益计划: {
    en: "Revenue Program",
    ja: "収益プログラム",
    ko: "수익 프로그램",
  },
  联系我们: { en: "Contact", ja: "お問い合わせ", ko: "문의하기" },
  使用条款: { en: "Terms", ja: "利用規約", ko: "이용 약관" },
  全部: { en: "All", ja: "すべて", ko: "전체" },
  冥想: { en: "Meditation", ja: "瞑想", ko: "명상" },
  午夜城市: { en: "Midnight City", ja: "真夜中の都市", ko: "한밤의 도시" },
  午夜漫游者: {
    en: "Midnight Wanderer",
    ja: "真夜中の漂泊者",
    ko: "한밤의 방랑자",
  },
  卡片: { en: "Card", ja: "カード", ko: "카드" },
  隐私政策: {
    en: "Privacy Policy",
    ja: "プライバシーポリシー",
    ko: "개인정보 처리방침",
  },
  发布作品: { en: "Publish Work", ja: "作品を公開", ko: "작품 게시" },
  城市: { en: "City", ja: "都市", ko: "도시" },
  城市夜景: { en: "City Nights", ja: "都市の夜景", ko: "도시 야경" },
  宇宙: { en: "Space", ja: "宇宙", ko: "우주" },
  宇宙星系: { en: "Space", ja: "宇宙", ko: "우주" },
  抽象: { en: "Abstract", ja: "抽象", ko: "추상" },
  抽象艺术: { en: "Abstract", ja: "抽象アート", ko: "추상 아트" },
  探索: { en: "Explore", ja: "探索", ko: "탐색" },
  摄影师作品: {
    en: "Photographer Works",
    ja: "写真家の作品",
    ko: "사진가 작품",
  },
  插画二次元: { en: "Illustration", ja: "イラスト", ko: "일러스트" },
  新上传: { en: "New uploads", ja: "新着アップロード", ko: "새 업로드" },
  最新上传: { en: "New uploads", ja: "新着アップロード", ko: "새 업로드" },
  暗夜: { en: "Night", ja: "夜", ko: "밤" },
  暗室精选: { en: "Darkroom Picks", ja: "暗室セレクト", ko: "다크룸 픽" },
  暗色: { en: "Dark", ja: "ダーク", ko: "다크" },
  暗色系: { en: "Dark", ja: "ダーク", ko: "다크" },
  "暮色将临，万物静默": {
    en: "Dusk falls, everything goes still",
    ja: "夕暮れが訪れ、すべてが静まる",
    ko: "황혼이 내려오고 모든 것이 고요해진다",
  },
  本周最佳: { en: "Best this week", ja: "今週のベスト", ko: "이번 주 베스트" },
  本周热榜: { en: "Trending this week", ja: "今週の人気", ko: "이번 주 인기" },
  极地寒流: { en: "Polar Current", ja: "極地の寒流", ko: "극지 한류" },
  极简: { en: "Minimal", ja: "ミニマル", ko: "미니멀" },
  极简主义: { en: "Minimal", ja: "ミニマル", ko: "미니멀" },
  渐变: { en: "Gradient", ja: "グラデーション", ko: "그라데이션" },
  深夜独处: {
    en: "Alone at Midnight",
    ja: "深夜のひとり時間",
    ko: "깊은 밤의 고요",
  },
  深夜漫游者: {
    en: "Midnight Wanderer",
    ja: "真夜中の漂泊者",
    ko: "한밤의 방랑자",
  },
  深海: { en: "Deep Sea", ja: "深海", ko: "심해" },
  深海蔚蓝: {
    en: "Deep Ocean Blue",
    ja: "深海のブルー",
    ko: "깊은 바다의 푸른빛",
  },
  清晨翠谷: {
    en: "Emerald Valley at Dawn",
    ja: "夜明けの翠の谷",
    ko: "새벽의 에메랄드 계곡",
  },
  热门排行: { en: "Popular", ja: "人気ランキング", ko: "인기 순위" },
  烈焰熔岩: { en: "Molten Lava", ja: "燃える溶岩", ko: "타오르는 용암" },
  熔岩: { en: "Lava", ja: "溶岩", ko: "용암" },
  炭火余烬: { en: "Embers", ja: "炭火の残り火", ko: "숯불의 여운" },
  炭火夜语: {
    en: "Night Talk in Embers",
    ja: "炭火の夜語り",
    ko: "숯불의 밤 이야기",
  },
  版权保护: { en: "Copyright Protection", ja: "著作権保護", ko: "저작권 보호" },
  粉樱之间: {
    en: "Between Pink Blossoms",
    ja: "桜色のあいだ",
    ko: "분홍 벚꽃 사이",
  },
  粉色心境: { en: "Pink State of Mind", ja: "ピンクの気分", ko: "분홍빛 마음" },
  自然: { en: "Nature", ja: "自然", ko: "자연" },
  自然风光: { en: "Nature", ja: "自然風景", ko: "자연 풍경" },
  苔藓与光: { en: "Moss and Light", ja: "苔と光", ko: "이끼와 빛" },
  苔藓之境: { en: "Moss Realm", ja: "苔の境地", ko: "이끼의 경계" },
  腮红: { en: "Blush", ja: "ブラッシュ", ko: "블러시" },
  "腮红 · 104": {
    en: "Blush · 104",
    ja: "ブラッシュ · 104",
    ko: "블러시 · 104",
  },
  编辑推荐: { en: "Editor pick", ja: "編集部おすすめ", ko: "에디터 추천" },
  "编辑推荐 · 本周": {
    en: "Editor pick · This week",
    ja: "編集部おすすめ · 今週",
    ko: "에디터 추천 · 이번 주",
  },
  消失于翡翠山谷的晨雾: {
    en: "Morning Mist Vanishing in the Emerald Valley",
    ja: "翡翠の谷に消える朝霧",
    ko: "에메랄드 계곡으로 사라지는 아침 안개",
  },
  "摄影师 Lin Yue 在四川盆地花了三天守候这一帧，光、雾与绿在这里达成了一次短暂和解。":
    {
      en: "Photographer Lin Yue waited three days in the Sichuan Basin for this frame, where light, mist, and green briefly found balance.",
      ja: "写真家 Lin Yue は四川盆地で三日間この一枚を待ち、光と霧と緑が一瞬だけ調和しました。",
      ko: "사진가 Lin Yue는 쓰촨 분지에서 사흘 동안 이 장면을 기다렸고, 빛과 안개와 초록이 잠시 균형을 이뤘습니다.",
    },
  上传作品: { en: "Upload Work", ja: "作品をアップロード", ko: "작품 업로드" },
  赛博: { en: "Cyber", ja: "サイバー", ko: "사이버" },
  赛博朋克: { en: "Cyberpunk", ja: "サイバーパンク", ko: "사이버펑크" },
  随机发现: { en: "Random Discovery", ja: "ランダム発見", ko: "랜덤 발견" },
  黄昏: { en: "Dusk", ja: "黄昏", ko: "황혼" },
  黄昏将至: {
    en: "Dusk Approaches",
    ja: "黄昏が近づく",
    ko: "황혼이 다가온다",
  },
};

export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALE_SET.has(value);
}

export function normalizeLocale(
  value: string | null | undefined,
): SupportedLocale | null {
  const normalized = value?.trim().replace("_", "-").toLowerCase();

  if (!normalized) {
    return null;
  }

  if (
    normalized === "zh" ||
    normalized === "zh-cn" ||
    normalized === "zh-hans"
  ) {
    return "zh-CN";
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  if (normalized.startsWith("ja") || normalized.startsWith("jp")) {
    return "ja";
  }

  if (normalized.startsWith("ko") || normalized.startsWith("kr")) {
    return "ko";
  }

  return value && isSupportedLocale(value) ? value : null;
}

function parseCookieHeader(cookieHeader: string | null | undefined) {
  const entries = new Map<string, string>();

  if (!cookieHeader) {
    return entries;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");

    if (!rawKey || rawValue.length === 0) {
      continue;
    }

    entries.set(rawKey, decodeURIComponent(rawValue.join("=")));
  }

  return entries;
}

export function resolveLocale(options?: {
  acceptLanguage?: string | null;
  cookieHeader?: string | null;
  headerLocale?: string | null;
  searchLocale?: string | null;
}) {
  return (
    normalizeLocale(options?.searchLocale) ??
    normalizeLocale(options?.headerLocale) ??
    normalizeLocale(
      parseCookieHeader(options?.cookieHeader).get(LOCALE_COOKIE_NAME),
    ) ??
    DEFAULT_LOCALE
  );
}

export function getRequestLocale(request: Request) {
  const url = new URL(request.url);

  return resolveLocale({
    acceptLanguage: request.headers.get("accept-language"),
    cookieHeader: request.headers.get("cookie"),
    headerLocale: request.headers.get(LOCALE_REQUEST_HEADER),
    searchLocale: url.searchParams.get("locale"),
  });
}

export function getLocaleFromHeaders(headers: Pick<Headers, "get">) {
  return resolveLocale({
    acceptLanguage: headers.get("accept-language"),
    cookieHeader: headers.get("cookie"),
    headerLocale: headers.get(LOCALE_REQUEST_HEADER),
  });
}

export function getLocaleCookieValue(cookieHeader: string | null | undefined) {
  return normalizeLocale(
    parseCookieHeader(cookieHeader).get(LOCALE_COOKIE_NAME),
  );
}

export function localeToHtmlLang(locale: SupportedLocale) {
  return (
    LOCALE_OPTIONS.find((option) => option.locale === locale)?.htmlLang ??
    "zh-CN"
  );
}

export function getLocalizedSiteMetadata(locale: SupportedLocale) {
  return SITE_METADATA[locale];
}

export function getI18nMessages(locale: SupportedLocale = DEFAULT_LOCALE) {
  return MESSAGES[locale];
}

export function getExploreOptionCopy(
  locale: SupportedLocale,
  group: "aspect" | "media" | "orientation" | "resolution" | "sort",
  value: string,
) {
  const groupMessages = MESSAGES[locale].explore.filters[group] as Record<
    string,
    { description?: string; label: string }
  >;

  return groupMessages[value];
}

export function getExploreCategoryCopy(locale: SupportedLocale, slug: string) {
  const categories = MESSAGES[locale].explore.categories as Record<
    string,
    { description: string; label: string }
  >;

  return categories[slug];
}

export function translateStaticTerm(
  value: string | null | undefined,
  locale: SupportedLocale,
) {
  if (!value || locale === DEFAULT_LOCALE) {
    return value ?? "";
  }

  return STATIC_TERM_TRANSLATIONS[value]?.[locale] ?? value;
}

export function translateStaticText(value: string, locale: SupportedLocale) {
  if (locale === DEFAULT_LOCALE) {
    return value;
  }

  const exactTranslation = translateStaticTerm(value, locale);

  if (exactTranslation !== value) {
    return exactTranslation;
  }

  if (value.includes(" · ")) {
    return value
      .split(" · ")
      .map((part) => translateStaticTerm(part.trim(), locale))
      .join(" · ");
  }

  return value;
}

export function getI18nPayload(locale: SupportedLocale) {
  return {
    locale,
    messages: getI18nMessages(locale),
    supportedLocales: LOCALE_OPTIONS,
  };
}

export function getLocaleResponseHeaders(locale: SupportedLocale) {
  return {
    "Content-Language": localeToHtmlLang(locale),
    Vary: "Cookie",
  } satisfies HeadersInit;
}
