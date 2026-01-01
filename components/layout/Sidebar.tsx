"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Avatar, DropdownMenu, Button, Tooltip, useToast } from "@underverse-ui/underverse";
import {
  Home,
  Plus,
  FolderOpen,
  Eye,
  ChevronLeft,
  ChevronDown,
  User as UserIcon,
  Settings,
  LogOut,
  List as ListIcon,
  Users as UsersIcon,
  Shield,
  Lock,
  LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/hooks/useLocale";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { loading } from "@/lib/utils/loading";
import { MenuTreeNode } from "@/lib/models/rbac-types";

// Icon mapping từ string trong database sang Lucide React component
const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Plus,
  FolderOpen,
  Eye,
  List: ListIcon,
  Users: UsersIcon,
  Settings,
  Shield,
  Lock,
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [menus, setMenus] = useState<MenuTreeNode[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());

  const pathname = usePathname();
  const { user, logout } = useAuth();
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const { addToast } = useToast();

  // Load menus từ cache hoặc API
  useEffect(() => {
    async function loadMenus() {
      if (!user?.id) {
        setIsLoadingMenus(false);
        return;
      }

      try {
        setIsLoadingMenus(true);

        const cacheKey = `user_menus_${user.id}_${locale}`;
        const cachedMenus = localStorage.getItem(cacheKey);

        if (cachedMenus) {
          // eslint-disable-next-line no-console
          console.log("[Sidebar] using cached menus", { cacheKey });
          setMenus(JSON.parse(cachedMenus));
          setIsLoadingMenus(false);
          return;
        }

        const response = await callApi<{ menus: MenuTreeNode[] }>(
          `${API_ROUTES.PERMISSIONS.MY_MENUS}?locale=${locale}`,
          HTTP_METHOD_ENUM.GET
        );

        const menusData = response.menus || [];
        // eslint-disable-next-line no-console
        console.log("[Sidebar] fetched menus from API", { count: menusData.length });
        setMenus(menusData);

        localStorage.setItem(cacheKey, JSON.stringify(menusData));
      } catch (error) {
        console.error("Failed to load menus:", error);
        setMenus([]);
      } finally {
        setIsLoadingMenus(false);
      }
    }

    loadMenus();

    const handleMenusChanged = (event: Event) => {
      const detailUserId = (event as CustomEvent<{ userId?: number }>).detail?.userId;
      // eslint-disable-next-line no-console
      console.log("[Sidebar] userMenusChanged received", {
        currentUserId: user?.id,
        detailUserId,
      });
      if (user?.id && detailUserId && detailUserId !== user.id) return;

      if (user?.id) {
        const prefix = `user_menus_${user.id}_`;
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(prefix)) {
              // eslint-disable-next-line no-console
              console.log("[Sidebar] clearing menu cache key", key);
              localStorage.removeItem(key);
            }
          });
        } catch {
          // ignore cache clear errors
        }
      }

      loadMenus();
    };

    window.addEventListener("userMenusChanged", handleMenusChanged);
    return () => window.removeEventListener("userMenusChanged", handleMenusChanged);
  }, [user?.id, locale]);

  const handleLogout = async () => {
    loading.show(t("logout") + "...");
    try {
      await callApi(API_ROUTES.AUTH.LOGOUT, HTTP_METHOD_ENUM.POST);

      // Clear menu cache
      if (user?.id) {
        const prefix = `user_menus_${user.id}_`;
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        });
      }

      logout();

      addToast({
        type: "success",
        message: t("logout"),
      });

      router.push(`/${locale}/login`);
    } catch (error) {
      console.error("Logout failed:", error);
      addToast({
        type: "error",
        message: t("logoutFailed") as string,
      });
    } finally {
      loading.hide();
    }
  };

  const userMenuItems = [
    {
      label: t("profile"),
      icon: UserIcon,
      onClick: () => router.push(`/${locale}/profile`),
    },
    {
      label: t("settings"),
      icon: Settings,
      onClick: () => {
        addToast({
          type: "info",
          message: "Trang cài đặt sẽ sớm ra mắt!",
        });
      },
    },
    {
      label: t("changePassword"),
      icon: Lock,
      onClick: () => router.push(`/${locale}/change-password`),
    },
    {
      label: t("logout"),
      icon: LogOut,
      onClick: handleLogout,
      className: "text-destructive hover:text-destructive",
    },
  ];

  const toggleSidebar = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    window.dispatchEvent(
      new CustomEvent("sidebarToggle", {
        detail: { isExpanded: newExpandedState },
      })
    );
  };

  const toggleMenu = (menuId: number) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  const isMenuActive = (menu: MenuTreeNode): boolean => {
    const menuPath = menu.path.replace(/^\/[a-z]{2}\//, "/");
    const currentPath = pathname.replace(/^\/[a-z]{2}\//, "/");

    if (currentPath === menuPath) return true;
    if (menuPath !== "/" && currentPath.startsWith(menuPath)) return true;

    if (menu.code === "tasks" && (currentPath.includes("/task/") || currentPath.includes("/tasks"))) {
      return true;
    }

    // Check if any child is active
    if (menu.children && menu.children.length > 0) {
      return menu.children.some((child) => isMenuActive(child));
    }

    return false;
  };

  const getMenuIcon = (iconName: string): LucideIcon => {
    return ICON_MAP[iconName] || Home;
  };

  const getMenuLabel = (menu: MenuTreeNode): string => {
    return menu.name;
  };

  const renderMenuItem = (menu: MenuTreeNode, depth: number = 0) => {
    const Icon = getMenuIcon(menu.icon);
    const isActive = isMenuActive(menu);
    const hasChildren = menu.children && menu.children.length > 0;
    const isMenuExpanded = expandedMenus.has(menu.id);
    const fullPath = `/${locale}${menu.path}`;

    // Parent menu with children
    if (hasChildren) {
      return (
        <div key={menu.id}>
          <button
            onClick={() => toggleMenu(menu.id)}
            className={cn(
              "flex items-center w-full transition-colors group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive ? "bg-primary/20 text-primary-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
              isExpanded ? "gap-3 px-3 py-3 rounded-lg" : "w-10 h-10 rounded-lg justify-center mx-auto"
            )}
          >
            <div className="shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            {isExpanded && (
              <>
                <span className="font-medium truncate flex-1 text-left">{getMenuLabel(menu)}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isMenuExpanded && "rotate-180")} />
              </>
            )}
          </button>

          {/* Submenu items */}
          {isExpanded && isMenuExpanded && (
            <div className="ml-8 mt-1 space-y-1">{menu.children!.map((child) => renderMenuItem(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    // Regular menu item (no children)
    return (
      <Link
        key={menu.id}
        href={fullPath}
        className={cn(
          "flex items-center transition-colors group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "bg-primary/20 text-primary-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
          isExpanded ? "gap-3 px-3 py-3 rounded-lg" : "w-10 h-10 rounded-lg justify-center mx-auto",
          depth > 0 && "text-sm" // Smaller text for submenus
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        {isExpanded ? (
          <span className="font-medium truncate">{getMenuLabel(menu)}</span>
        ) : (
          <Tooltip content={getMenuLabel(menu)} placement="right">
            <span className="sr-only">{getMenuLabel(menu)}</span>
          </Tooltip>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-screen border-r border-border/60 bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/60 transition-all duration-300 ease-in-out flex flex-col",
        isExpanded ? "w-64" : "w-20",
        className
      )}
      role="navigation"
      aria-label="Primary"
    >
      {/* Header */}
      <div className="h-16 px-4 border-b border-border/60 flex items-center">
        <div className={cn("flex items-center w-full", isExpanded ? "justify-between" : "justify-end")}>
          {isExpanded && (
            <div className="flex items-center gap-2">
              <Image src="/ocr-logo.svg" alt="OCR Editor logo" width={32} height={32} className="shrink-0" priority />
              <h2 className="text-lg font-semibold text-foreground">OCR Editor</h2>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-foreground"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", !isExpanded && "rotate-180")} />
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto" aria-label="Primary menu">
        {isLoadingMenus ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn("animate-pulse bg-muted rounded-lg", isExpanded ? "h-12" : "h-10 w-10 mx-auto")} />
            ))}
          </>
        ) : menus.length > 0 ? (
          menus.map((menu) => renderMenuItem(menu))
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">{isExpanded ? "No menus available" : ""}</div>
        )}
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-border mt-auto relative">
        {user ? (
          <div className="relative z-60">
            <DropdownMenu
              trigger={
                <div
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer w-full",
                    !isExpanded && "justify-center"
                  )}
                >
                  <Avatar src={user.avatar_url} size="sm" className="w-8 h-8" />
                  {isExpanded && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate">{user.name || user.user_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  )}
                </div>
              }
              items={userMenuItems}
              placement={isExpanded ? "top-start" : "top"}
              contentClassName="z-60"
            />
          </div>
        ) : (
          <div className={cn("flex items-center gap-3 p-3 rounded-lg animate-pulse", !isExpanded && "justify-center")}>
            <div className="w-8 h-8 bg-muted rounded-full" />
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-muted rounded mb-1" />
                <div className="h-3 bg-muted/60 rounded w-2/3" />
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
