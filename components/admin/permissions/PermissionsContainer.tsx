"use client";

import DashboardLayout from "@/app/[locale]/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { callApi } from "@/lib/utils/api-client";
import { AccessDenied, Button, Card, Combobox, Switch, useToast } from "@underverse-ui/underverse";
import { CheckCircle, ChevronRight, Folder, Lock, RefreshCw, Shield, Users, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/hooks/useLocale";

interface MenuTreeNode {
  id: number;
  code: string;
  name: string;
  path: string;
  icon: string;
  parent_id: number | null;
  children?: MenuTreeNode[];
}

interface Role {
  id: number;
  code: string;
  name: string;
  level: number;
}

interface UserSummary {
  id: number;
  name: string;
  user_name?: string;
  email?: string;
  role?: string;

  // Optional: roles assigned to this user (used in UI only)
  roles?: RoleSummary[];
}

interface RoleSummary {
  id: number;
  code: string;
  name: string;
}

interface MenuAction {
  id: number;
  menu_id: number;
  action_id: number;
  action_code: string;
  action_name: string;
  permission_id: number;
  permission_code: string;
}

interface RolePermission {
  role_id: number;
  permission_id: number;
  is_granted: boolean;
}

interface UserPermissionAssignment {
  id: number;
  user_id: number;
  permission_id: number;
  is_granted: boolean;
}

function findFirstLeafMenu(nodes: MenuTreeNode[]): MenuTreeNode | null {
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      const leaf = findFirstLeafMenu(node.children);
      return leaf || node;
    }
    return node;
  }
  return null;
}

function buildExpandedState(nodes: MenuTreeNode[], targetId: number, path: MenuTreeNode[] = []): Record<number, boolean> | null {
  for (const node of nodes) {
    const currentPath = [...path, node];
    if (node.id === targetId) {
      const expanded: Record<number, boolean> = {};
      currentPath.slice(0, -1).forEach((n) => {
        expanded[n.id] = true;
      });
      return expanded;
    }
    if (node.children && node.children.length > 0) {
      const res = buildExpandedState(node.children, targetId, currentPath);
      if (res) return res;
    }
  }
  return null;
}

export default function PermissionsContainer() {
  const { user } = useAuth();
  const t = useTranslations("Settings.permissions");
  const locale = useLocale();
  const [menuTree, setMenuTree] = useState<MenuTreeNode[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<MenuTreeNode | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [menuActions, setMenuActions] = useState<MenuAction[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermissionAssignment[]>([]);
  const [userRoles, setUserRoles] = useState<RoleSummary[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"role" | "user">("role");
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const { addToast } = useToast();

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const setup = await callApi<{
        menuTree: MenuTreeNode[];
        roles: Role[];
        rolePermissions: RolePermission[];
      }>(`${API_ROUTES.RBAC.PERMISSIONS.SETUP_VIEW}?locale=${locale}`, HTTP_METHOD_ENUM.GET, undefined, {
        silent: true,
      });

      const menuTreeData = setup.menuTree || [];
      setMenuTree(menuTreeData);
      setRoles(setup.roles || []);
      setRolePermissions(setup.rolePermissions || []);

      if (!selectedMenu && menuTreeData.length > 0) {
        const defaultMenu = findFirstLeafMenu(menuTreeData) || menuTreeData[0];
        if (defaultMenu) {
          setSelectedMenu(defaultMenu);
          const expanded = buildExpandedState(menuTreeData, defaultMenu.id);
          if (expanded) {
            setExpandedMenus(expanded);
          }
        }
      }
    } catch (err: any) {
      const message = err?.message || "";
      if (message === "Forbidden") {
        setForbidden(true);
      } else {
        addToast({ type: "error", message: message || (t("loadError") as string) });
      }
    } finally {
      setLoading(false);
    }
  }, [addToast, t, selectedMenu]);

  // Load actions for selected menu
  const loadMenuActions = useCallback(
    async (menuId: number) => {
      try {
        const actions = await callApi<MenuAction[]>(`${API_ROUTES.RBAC.MENUS.ACTIONS(menuId)}?locale=${locale}`, HTTP_METHOD_ENUM.GET, undefined, {
          silent: true,
        });
        setMenuActions(actions || []);
      } catch (err: any) {
        addToast({ type: "error", message: err?.message || "Failed to load menu actions" });
        setMenuActions([]);
      }
    },
    [addToast]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedMenu) {
      loadMenuActions(selectedMenu.id);
    }
  }, [selectedMenu, loadMenuActions]);
  // Load users for user-permission mode (first page)
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await callApi<{ data: UserSummary[] }>(`/api/users?q=&page=1&pageSize=50`, HTTP_METHOD_ENUM.GET, undefined, { silent: true });
      setUsers(res.data || []);
    } catch (err: any) {
      setUsers([]);
      addToast({ type: "error", message: err?.message || "Failed to load users" });
    } finally {
      setUsersLoading(false);
    }
  }, [addToast]);

  // Load user-permission assignments when selecting a user
  const loadUserPermissions = useCallback(
    async (userId: number) => {
      try {
        const [assignments, rolesOfUser] = await Promise.all([
          callApi<UserPermissionAssignment[]>(`/api/rbac/permissions/users/${userId}/permissions`, HTTP_METHOD_ENUM.GET, undefined, { silent: true }),
          callApi<RoleSummary[]>(`/api/rbac/users/${userId}/roles`, HTTP_METHOD_ENUM.GET, undefined, {
            silent: true,
          }),
        ]);

        // Debug logging để kiểm tra dữ liệu
        // eslint-disable-next-line no-console
        console.log("[Permissions] loadUserPermissions", {
          userId,
          assignments,
          rolesOfUser,
          allRoles: roles,
          allUsers: users,
        });

        setUserPermissions(assignments || []);

        // Nếu user chưa có mapping trong user_role_assignments (rolesOfUser rỗng)
        // thì fallback sang role chính trong bảng users (user.role) nếu có.
        if (!rolesOfUser || rolesOfUser.length === 0) {
          const userInfo = users.find((u) => u.id === userId);
          if (userInfo?.role) {
            const primaryRole = roles.find((r) => r.code === userInfo.role);
            if (primaryRole) {
              // eslint-disable-next-line no-console
              console.log("[Permissions] Fallback primaryRole from user.role", {
                userId,
                userRole: userInfo.role,
                primaryRole,
              });
              setUserRoles([{ id: primaryRole.id, code: primaryRole.code, name: primaryRole.name }]);
              return;
            }
          }
        }

        // eslint-disable-next-line no-console
        console.log("[Permissions] Using rolesOfUser from API", { userId, rolesOfUser });
        setUserRoles(rolesOfUser || []);
      } catch (err: any) {
        setUserPermissions([]);
        setUserRoles([]);
        addToast({ type: "error", message: err?.message || "Failed to load user permissions" });
      }
    },
    [addToast, users, roles]
  );

  // Load users when switching to user mode (once)
  useEffect(() => {
    if (mode === "user" && users.length === 0 && !usersLoading) {
      loadUsers();
    }
  }, [mode, users.length, usersLoading, loadUsers]);

  // Check if role has permission
  const hasPermission = useCallback(
    (roleId: number, permissionId: number): boolean => {
      const rp = rolePermissions.find((rp) => rp.role_id === roleId && rp.permission_id === permissionId);
      return rp?.is_granted ?? false;
    },
    [rolePermissions]
  );

  // Toggle permission
  const togglePermission = async (roleId: number, permissionId: number, currentlyGranted: boolean) => {
    try {
      const endpoint = currentlyGranted
        ? `/api/rbac/permissions/roles/${roleId}/permissions/${permissionId}/revoke`
        : `/api/rbac/permissions/roles/${roleId}/permissions/${permissionId}/grant`;

      await callApi(endpoint, HTTP_METHOD_ENUM.POST, undefined, { silent: true });

      // Update local state
      setRolePermissions((prev) => {
        const existing = prev.find((rp) => rp.role_id === roleId && rp.permission_id === permissionId);
        if (existing) {
          return prev.map((rp) => (rp.role_id === roleId && rp.permission_id === permissionId ? { ...rp, is_granted: !currentlyGranted } : rp));
        } else {
          return [...prev, { role_id: roleId, permission_id: permissionId, is_granted: !currentlyGranted }];
        }
      });

      addToast({
        type: "success",
        message: currentlyGranted ? (t("revokeSuccess") as string) : (t("grantSuccess") as string),
      });
    } catch (err: any) {
      addToast({ type: "error", message: err?.message || "Failed to update permission" });
    }
  };

  // Toggle user-specific permission
  const toggleUserPermission = async (permissionId: number, currentlyGranted: boolean) => {
    if (!selectedUser) return;
    const userId = selectedUser.id;

    try {
      const endpoint = currentlyGranted
        ? `/api/rbac/permissions/users/${userId}/permissions/${permissionId}/revoke`
        : `/api/rbac/permissions/users/${userId}/permissions/${permissionId}/grant`;

      await callApi(endpoint, HTTP_METHOD_ENUM.POST, undefined, { silent: true });

      setUserPermissions((prev) => {
        const existing = prev.find((up) => up.user_id === userId && up.permission_id === permissionId);
        if (existing) {
          // Toggle giữa grant (true) và deny (false)
          return prev.map((up) => (up.user_id === userId && up.permission_id === permissionId ? { ...up, is_granted: !currentlyGranted } : up));
        }
        // Nếu chưa có bản ghi: hiện tại đang coi như "denied/default".
        // Khi bật switch => tạo bản ghi grant (true)
        return [...prev, { id: 0, user_id: userId, permission_id: permissionId, is_granted: true }];
      });

      // eslint-disable-next-line no-console
      console.log("[Permissions] toggleUserPermission", {
        userId,
        permissionId,
        previousEffective: currentlyGranted,
      });

      addToast({
        type: "success",
        message: currentlyGranted ? (t("revokeSuccess") as string) : (t("grantSuccess") as string),
      });

      if (typeof window !== "undefined") {
        const prefix = `user_menus_${userId}_`;
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(prefix)) {
              // eslint-disable-next-line no-console
              console.log("[Permissions] clearing menu cache key", key);
              localStorage.removeItem(key);
            }
          });
        } catch {
          // ignore cache clear errors
        }
        window.dispatchEvent(
          new CustomEvent("userMenusChanged", {
            detail: { userId },
          })
        );
        // eslint-disable-next-line no-console
        console.log("[Permissions] dispatched userMenusChanged", { userId });
      }
    } catch (err: any) {
      addToast({ type: "error", message: err?.message || "Failed to update user permission" });
    }
  };

  // Toggle menu expansion
  const toggleMenu = (menuId: number) => {
    setExpandedMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  // Render menu tree item
  const renderMenuItem = (menu: MenuTreeNode, depth: number = 0) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus[menu.id];
    const isSelected = selectedMenu?.id === menu.id;

    return (
      <div key={menu.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isSelected ? "bg-primary/10 border-l-4 border-primary text-primary font-medium" : "hover:bg-muted/50"
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleMenu(menu.id);
            }
            setSelectedMenu(menu);
          }}
        >
          {hasChildren && (
            <ChevronRight
              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu(menu.id);
              }}
            />
          )}
          {!hasChildren && <div className="w-4" />}
          <Folder className="w-4 h-4" />
          <span className="text-sm flex-1">{menu.name}</span>
        </div>
        {hasChildren && isExpanded && <div>{menu.children!.map((child) => renderMenuItem(child, depth + 1))}</div>}
      </div>
    );
  };

  if (forbidden) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <AccessDenied title={t("forbidden") as string} description={t("forbiddenDesc") as string} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t("title") as string}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">{t("subtitle") as string}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={loadData}
                disabled={loading}
                className="hover:bg-info/10 border-info/30 text-info hover:text-info"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {t("refresh")}
              </Button>
            </div>
          </div>

          {/* Mode Toggle - Redesigned */}
          <Card className="glass-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
                  {mode === "role" ? <Shield className="w-5 h-5 text-primary" /> : <Users className="w-5 h-5 text-primary" />}
                  <div>
                    <p className="text-xs text-muted-foreground">{t("viewMode") || "View Mode"}</p>
                    <p className="text-sm font-semibold">{mode === "role" ? t("modeRole") || "By Role" : t("modeUser") || "By User"}</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <p className="text-sm text-muted-foreground">
                  {mode === "role" ? t("roleModeDesc") || "Manage permissions for each role" : t("userModeDesc") || "Manage direct user permissions"}
                </p>
              </div>
              <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50">
                <Button
                  size="md"
                  variant={mode === "role" ? "primary" : "ghost"}
                  onClick={() => setMode("role")}
                  className="min-w-[120px] transition-all"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {t("modeRole") || "By Role"}
                </Button>
                <Button
                  size="md"
                  variant={mode === "user" ? "primary" : "ghost"}
                  onClick={() => setMode("user")}
                  className="min-w-[120px] transition-all"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {t("modeUser") || "By User"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-10 gap-6">
          {/* Left: Menu Tree (3 cols) */}
          <div className="col-span-3">
            <Card className="glass-card shadow-lg border-2 border-primary/20">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Folder className="w-5 h-5 text-primary" />
                  {t("menuTree") || "Menu Tree"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{t("selectMenu") || "Select a menu to manage permissions"}</p>
              </div>
              <div className="space-y-1 max-h-[600px] overflow-y-auto">{menuTree.map((menu) => renderMenuItem(menu))}</div>
            </Card>
          </div>

          {/* Right: Actions Matrix (7 cols) */}
          <div className="col-span-7">
            {selectedMenu ? (
              <Card className="glass-card shadow-lg border-2 border-secondary/20 ">
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Lock className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">{selectedMenu.name}</h3>
                        <p className="text-sm text-muted-foreground">{t("managePermissions") || "Manage action permissions for this menu"}</p>
                      </div>
                    </div>
                    {mode === "user" && (
                      <div className="flex flex-col items-end gap-2">
                        <Combobox
                          value={selectedUser?.name || ""}
                          onChange={(option) => {
                            if (!option || option === "") {
                              setSelectedUser(null);
                              setUserPermissions([]);
                              return;
                            }
                            const value = typeof option === "string" ? option : String(option);
                            const u = users.find((user) => user.name === value);
                            if (u) {
                              setSelectedUser(u);
                              loadUserPermissions(u.id);
                            }
                          }}
                          options={users.map((u) => u.name)}
                          placeholder={t("searchUser") || "Select user..."}
                          disabled={usersLoading}
                          className="w-56"
                        />
                        {usersLoading && <p className="text-xs text-muted-foreground">{t("searching") || "Searching..."}</p>}
                        {selectedUser && (
                          <p className="text-xs text-muted-foreground">
                            {t("selectedUser") || "Selected user"}: <span className="font-medium">{selectedUser.name}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {menuActions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t("noActions") || "No actions defined for this menu"}</p>
                  </div>
                ) : mode === "role" ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-sm">{t("role") || "Role"}</th>
                          {menuActions.map((action) => (
                            <th key={action.id} className="text-center py-3 px-4 font-medium text-sm">
                              {action.action_name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role) => (
                          <tr key={role.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{role.name}</span>
                              </div>
                            </td>
                            {menuActions.map((action) => {
                              const granted = hasPermission(role.id, action.permission_id);
                              return (
                                <td key={action.id} className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {granted ? (
                                      <CheckCircle className="w-4 h-4 text-success" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-muted-foreground/30" />
                                    )}
                                    <Switch
                                      checked={granted}
                                      onCheckedChange={() => togglePermission(role.id, action.permission_id, granted)}
                                      size="sm"
                                    />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {!selectedUser ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{t("selectUserToManage") || "Select a user to manage direct permissions"}</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-medium text-sm">
                              {t("userOverride") || "User direct permission"}
                            </th>
                            {menuActions.map((action) => (
                              <th key={action.id} className="text-center py-3 px-4 font-medium text-sm">
                                {action.action_name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {selectedUser?.name}
                            </td>
                            {menuActions.map((action) => {
                              const directAssignment = userPermissions.find(
                                (perm) =>
                                  perm.user_id === selectedUser.id &&
                                  perm.permission_id === action.permission_id
                              );
                              const directValue = directAssignment?.is_granted;

                              // Kiểm tra quyền đến từ các role của user
                              const roleHasPermission =
                                userRoles.length > 0 &&
                                userRoles.some((role) =>
                                  rolePermissions.some(
                                    (rp) =>
                                      rp.role_id === role.id &&
                                      rp.permission_id === action.permission_id &&
                                      rp.is_granted
                                  )
                                );

                              // Quyền hiệu lực cuối cùng: user override (true/false) ưu tiên, nếu không có thì dùng quyền từ role
                              const effectiveGranted =
                                typeof directValue === "boolean" ? directValue : roleHasPermission;

                              // eslint-disable-next-line no-console
                              console.log("[Permissions] Row debug", {
                                actionCode: action.action_code,
                                permissionId: action.permission_id,
                                directValue,
                                roleHasPermission,
                                effectiveGranted,
                                userRoles,
                              });

                              return (
                                <td key={action.id} className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {effectiveGranted ? (
                                      <CheckCircle className="w-4 h-4 text-success" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-muted-foreground/30" />
                                    )}
                                    <Switch
                                      checked={effectiveGranted}
                                      onCheckedChange={() =>
                                        toggleUserPermission(action.permission_id, effectiveGranted)
                                      }
                                      size="sm"
                                    />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </Card>
            ) : (
              <Card className="glass-card shadow-lg border-2 border-muted/20 p-12">
                <div className="text-center text-muted-foreground">
                  <Lock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">{t("noMenuSelected") || "No Menu Selected"}</h3>
                  <p className="text-sm">{t("selectMenuToStart") || "Select a menu from the tree to manage its permissions"}</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
