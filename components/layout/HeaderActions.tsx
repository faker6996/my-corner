"use client";

import { ThemeToggle, LanguageSwitcher, Button, DropdownMenu, NotificationBadge } from "@underverse-ui/underverse";
import { Bell, Settings, CheckCheck, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface HeaderActionsProps {
  className?: string;
  showNotifications?: boolean;
  showSettings?: boolean;
  notificationCount?: number;
  currentLocale?: string;
}
const locales = [
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
];

export function HeaderActions({
  className,
  showNotifications = true,
  showSettings = true,
  notificationCount = 3,
  currentLocale,
}: HeaderActionsProps) {
  const notifications = [
    { id: 1, title: "OCR task #234 completed", unread: true },
    { id: 2, title: "Low confidence regions detected", unread: true },
    { id: 3, title: "New login from Chrome", unread: false },
  ];
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  // Initialize theme from localStorage and keep <html> class in sync
  useEffect(() => {
    try {
      const stored = (typeof window !== 'undefined' && localStorage.getItem('theme')) as any;
      const initial: "light" | "dark" | "system" = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
      setTheme(initial);
      applyTheme(initial);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyTheme = (mode: "light" | "dark" | "system") => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    try { localStorage.setItem('theme', mode); } catch {}
  };

  const handleThemeChange = (next: "light" | "dark" | "system") => {
    setTheme(next);
    applyTheme(next);
  };
  const router = useRouter();
  const pathname = usePathname();
  const detectedLocale = currentLocale || (pathname?.split("/")[1] || "vi");
  const onSwitch = (code: string) => {
    const segs = pathname.split("/");
    segs[1] = code;
    router.push(segs.join("/"));
  };
  return (
    <div className={cn("flex items-center gap-3", className)} role="toolbar" aria-label="Header toolbar">
      {/* Notifications */}
      {showNotifications && (
        <DropdownMenu
          trigger={
            <NotificationBadge count={notificationCount} position="top-right">
              <Button variant="ghost" size="sm" aria-label="Notifications" icon={Bell} />
            </NotificationBadge>
          }
          contentClassName="w-72"
        >
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Notifications</div>
          <div className="max-h-72 overflow-auto">
            {notifications.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={cn("px-2 py-2 text-sm rounded flex items-start gap-2", n.unread ? "bg-accent/40" : "")}>
                  <span className={cn("mt-1 inline-block w-2 h-2 rounded-full", n.unread ? "bg-primary" : "bg-border")} />
                  <span className="flex-1 text-foreground">{n.title}</span>
                  {n.unread ? <Check className="w-4 h-4 opacity-60" /> : null}
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border/60 mt-1 p-1 flex gap-1">
            <Button variant="ghost" size="sm" className="flex-1" title="Mark all read" icon={CheckCheck}>
              Mark all
            </Button>
            <Button variant="ghost" size="sm" className="flex-1" title="Clear" icon={Trash2}>
              Clear
            </Button>
          </div>
        </DropdownMenu>
      )}

      {/* Settings */}
      {showSettings && (
        <Button variant="ghost" size="sm" aria-label="Settings" icon={Settings} />
      )}

      {/* Language Switcher */}
      <LanguageSwitcher locales={locales} currentLocale={detectedLocale} onSwitch={onSwitch} />

      {/* Theme Toggle */}
      <ThemeToggle theme={theme} onChange={handleThemeChange} />
    </div>
  );
}
