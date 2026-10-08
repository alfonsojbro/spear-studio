import type { Platform } from "@spear/db";
import { InstagramLogo, TiktokLogo, YoutubeLogo } from "@/components/icons";
import { cn } from "@/components/ui/cn";

export const PLATFORM_META: Record<Platform, { label: string; Icon: typeof InstagramLogo; url: (h: string) => string }> = {
  ig: { label: "Instagram", Icon: InstagramLogo, url: (h) => `https://instagram.com/${h}` },
  tiktok: { label: "TikTok", Icon: TiktokLogo, url: (h) => `https://tiktok.com/@${h}` },
  youtube: { label: "YouTube", Icon: YoutubeLogo, url: (h) => `https://youtube.com/@${h}` },
};

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const { Icon, label } = PLATFORM_META[platform];
  return <Icon aria-label={label} className={cn("size-4", className)} />;
}
