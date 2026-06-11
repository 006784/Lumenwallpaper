/**
 * 首页骨架屏 —— 在动态渲染（force-dynamic）完成前立即显示，
 * 消除白屏，提升主观加载流畅度。纯静态、零数据依赖。
 */
export default function HomeLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="加载中"
      className="glass-panel-grid relative overflow-hidden px-4 pb-10 pt-24 sm:px-6 lg:px-10 lg:pb-14 lg:pt-28"
    >
      <div className="relative mx-auto grid max-w-[1600px] gap-10 lg:min-h-[calc(100svh-96px)] lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.8fr)] lg:items-stretch">
        {/* 左栏：文案占位 */}
        <div className="flex min-w-0 flex-col justify-between gap-10 py-4 lg:py-8">
          <div className="space-y-8">
            <div className="skeleton-block h-8 w-44 rounded-full" />
            <div className="space-y-4">
              <div className="skeleton-block h-[clamp(2.4rem,5vw,4.6rem)] w-[80%] rounded-xl" />
              <div className="skeleton-block h-[clamp(2.4rem,5vw,4.6rem)] w-[60%] rounded-xl" />
            </div>
            <div className="space-y-3">
              <div className="skeleton-block h-4 w-[70%] rounded" />
              <div className="skeleton-block h-4 w-[55%] rounded" />
            </div>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton-block h-9 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton-block h-7 w-16 rounded" />
                <div className="skeleton-block h-3 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* 右栏：胶卷格子占位 */}
        <div className="relative min-h-[360px] overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#080704,#0b0906_42%,#11100b_100%)] sm:min-h-[460px] lg:min-h-full">
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="skeleton-block-dark rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
