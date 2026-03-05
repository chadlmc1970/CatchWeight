export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-6 h-6 text-sm",
    md: "w-9 h-9 text-lg",
    lg: "w-12 h-12 text-2xl"
  };

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-lg flex items-center justify-center font-bold shadow-lg`}>
      ⚖️
    </div>
  );
}

export function BrandMark({ size = "md", showTagline = false }: { size?: "sm" | "md" | "lg"; showTagline?: boolean }) {
  const textSizes = {
    sm: { title: "text-sm", tagline: "text-[8px]" },
    md: { title: "text-base", tagline: "text-[10px]" },
    lg: { title: "text-xl", tagline: "text-xs" }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <BrandLogo size={size} />
      <div className="flex flex-col">
        <span className={`${textSizes[size].title} font-bold tracking-tight leading-none text-slate-900 dark:text-white`}>
          Catch Weight
        </span>
        {showTagline && (
          <span className={`${textSizes[size].tagline} text-blue-600 dark:text-blue-400 font-semibold tracking-wide`}>
            INTELLIGENCE
          </span>
        )}
      </div>
    </div>
  );
}
