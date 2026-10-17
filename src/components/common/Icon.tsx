import type { SVGProps } from "react";

const PATHS: Record<string, string> = {
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  captable: "M3 5h18M3 10h18M3 15h18M3 20h18M9 5v15",
  ownership:
    "M12 3v6M5 21v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6M12 9a2 2 0 1 0 0-.01M5 21a2 2 0 1 0 0-.01M19 21a2 2 0 1 0 0-.01",
  ubo: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  waterfall: "M3 4h4v6H3zM10 8h4v6h-4zM17 12h4v8h-4z",
  resolutions: "M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h9",
  certificates: "M6 3h12a1 1 0 0 1 1 1v12l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1zM9 8h6M9 11h4",
  succession: "M4 7h12l-3-3M20 17H8l3 3M4 7v0M20 17v0",
  vault: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM12 12a2 2 0 1 0 0-.01M12 14v3",
  audit: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  setup:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 1-2-1V5h-4v2l-2 1-2-1-2 4 2 1v2l-2 1 2 4 2-1 2 1v2h4v-2l2-1 2 1 2-4-2-1z",
  members:
    "M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a6 6 0 0 1 12 0M14 20a5 5 0 0 1 8 0",
  security: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM12 11v4M12 8.5v.01",
  password: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6L6 18",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  arrow: "M5 12h14M13 6l6 6-6 6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5",
  import: "M12 3v12M7 10l5 5 5-5M4 19h16",
  transfer: "M4 8h14l-3-3M20 16H6l3 3",
  rounds: "M3 20h18M6 20V12M11 20V6M16 20V9M21 20V3",
  options: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  portal: "M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6",
  sign: "M4 20h16M6 16l9-9 3 3-9 9H6z",
  check: "M5 12l5 5 9-10",
  alert: "M12 3l10 18H2zM12 10v4M12 17.5v.01",
  guide: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7M8 11h5",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
