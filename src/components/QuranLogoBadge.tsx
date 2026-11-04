import React from "react";

export const QAF_PATH_24 =
  "M 17.38 2.25 L 16.27 3.83 L 17.94 5.29 L 18.96 3.77 L 18.99 3.65 Z " +
  "M 14.42 2.43 L 13.61 3.59 L 13.34 4.04 L 14.98 5.47 L 16 3.95 L 16.03 3.83 Z " +
  "M 16.2 8.6 L 15.66 8.72 L 15.43 8.84 L 15.01 9.13 L 14.5 9.68 L 14.02 10.36 L 13.49 11.42 L 13.14 12.49 L 12.96 13.37 L 12.96 13.7 L 12.93 13.73 L 12.96 14.17 L 13.02 14.38 L 13.2 14.67 L 13.6 15.07 L 14.16 15.4 L 14.57 15.55 L 15.49 15.69 L 18 15.69 L 18.07 15.97 L 18.07 16.36 L 17.58 16.85 L 17.26 17.11 L 16.7 17.52 L 16.25 17.79 L 15.57 18.15 L 14.78 18.47 L 13.68 18.8 L 12.3 19.03 L 11.56 19.06 L 11.53 19.09 L 10.43 19.09 L 10.4 19.06 L 9.99 19.06 L 9.16 18.94 L 8.37 18.74 L 7.86 18.53 L 7.13 18.06 L 6.64 17.57 L 6.43 17.3 L 6.28 17.07 L 6.02 16.48 L 5.84 15.8 L 5.81 15.26 L 5.78 15.24 L 5.78 14.61 L 5.81 14.59 L 5.78 14.5 L 5.81 14.47 L 5.81 13.96 L 5.84 13.94 L 5.87 13.4 L 6.02 12.55 L 6.16 11.99 L 6.15 11.91 L 5.97 11.85 L 5.31 13.2 L 4.98 14.14 L 4.69 15.53 L 4.66 16 L 4.63 16.03 L 4.6 17.04 L 4.63 17.07 L 4.66 17.69 L 4.75 18.16 L 5.1 19.19 L 5.54 19.87 L 6.06 20.42 L 6.53 20.77 L 7.24 21.16 L 7.86 21.4 L 8.66 21.6 L 9.25 21.69 L 10.26 21.72 L 10.29 21.75 L 11.47 21.72 L 11.5 21.69 L 11.91 21.69 L 11.94 21.66 L 12.59 21.6 L 13.45 21.42 L 14.72 21.04 L 15.31 20.8 L 16.25 20.33 L 16.96 19.89 L 17.44 19.53 L 17.97 19.09 L 18.43 18.63 L 18.75 17.98 L 19.08 17.16 L 19.28 16.42 L 19.37 15.94 L 19.37 15.71 L 19.4 15.68 L 19.4 14.08 L 19.37 14.05 L 19.37 13.64 L 19.34 13.61 L 19.31 13.11 L 19.16 12.19 L 18.99 11.48 L 18.69 10.6 L 18.46 10.09 L 18.04 9.47 L 17.67 9.1 L 17.17 8.78 L 16.67 8.63 Z " +
  "M 15.44 10.92 L 15.75 10.91 L 16.2 11.05 L 16.49 11.26 L 16.95 11.72 L 17.21 12.1 L 17.45 12.58 L 17.6 13.08 L 17.58 13.27 L 16.08 13.27 L 16.05 13.24 L 15.75 13.24 L 15.37 13.18 L 14.87 13.03 L 14.63 12.92 L 14.45 12.8 L 14.2 12.55 L 14.05 12.22 L 14.05 11.87 L 14.17 11.63 L 14.33 11.44 L 14.75 11.14 L 15.16 10.97 Z";

export function QafIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      fillRule="evenodd"
      className={className}
      style={{ maxWidth: "100%", maxHeight: "100%" }}
      aria-hidden="true"
    >
      <path d={QAF_PATH_24} />
    </svg>
  );
}

interface QuranLogoBadgeProps {
  className?: string;
  iconClassName?: string;
  style?: React.CSSProperties;
}

export function QuranLogoBadge({
  className = "h-8.5 w-8.5 sm:h-9.5 sm:w-9.5 rounded-[5px]",
  iconClassName = "size-4.5 sm:size-5",
  style,
}: QuranLogoBadgeProps) {
  return (
    <div
      style={style}
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-[#c99f66] via-[#b88e58] to-[#9e743f] text-[#0b0f13] border border-[#d4af6a]/70 shadow-[0_2px_8px_rgba(184,142,88,0.25)] transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      <QafIcon className={`${iconClassName} shrink-0 text-[#0b0f13] fill-current`} />
    </div>
  );
}
