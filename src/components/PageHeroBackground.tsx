import React from "react";

interface PageHeroBackgroundProps {
  className?: string;
  alt?: string;
  fadeBottom?: boolean;
  fadeTop?: boolean;
  intensity?: "normal" | "subtle";
  loading?: "eager" | "lazy";
}

/**
 * Reusable Hero Background Component
 * Provides authentic, consistent visual branding across all pages & posts
 * Features:
 * - Responsive lightweight WebP background art (13KB on mobile, crisp on desktop)
 * - Light/Sepia mode: Warm radiant ambient tint & sepia filter
 * - Dark mode: Deep golden-amber contrast on obsidian canvas
 * - Smooth transition between themes
 */
export function PageHeroBackground({
  className = "",
  alt = "কুরআন অন্বেষা — ব্যাকগ্রাউন্ড আবহ",
  fadeBottom = false,
  fadeTop = false,
  intensity = "normal",
  loading = "eager",
}: PageHeroBackgroundProps) {
  const isSubtle = intensity === "subtle";

  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <picture className="w-full h-full block">
        <source media="(max-width: 640px)" srcSet="/images/hero-bg-sm.webp" width="480" height="320" />
        <source media="(max-width: 1024px)" srcSet="/images/hero-bg-mobile.webp" width="720" height="480" />
        <img
          src="/images/hero-bg.webp"
          alt={alt}
          title={alt}
          width="1024"
          height="682"
          className={`w-full h-full object-cover object-center -scale-x-100 select-none pointer-events-none mix-blend-multiply filter sepia-[0.9] contrast-[1.25] dark:mix-blend-normal dark:filter-none transition-all duration-300 ${
            isSubtle
              ? "opacity-20 sm:opacity-25 dark:opacity-25"
              : "opacity-30 sm:opacity-35 dark:opacity-40"
          }`}
          loading={loading}
          decoding="async"
        />
      </picture>

      {/* Sepia warm radiant ambient tint overlay for Light theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#d3b88e]/35 via-transparent to-[#f1e2cb]/80 dark:hidden pointer-events-none" />

      {/* Optional smooth top fade into body background */}
      {fadeTop && (
        <div className="absolute inset-x-0 top-0 h-16 sm:h-24 bg-gradient-to-b from-background via-background/60 to-transparent pointer-events-none" />
      )}

      {/* Optional smooth bottom fade into body background */}
      {fadeBottom && (
        <div className="absolute inset-x-0 bottom-0 h-16 sm:h-24 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
