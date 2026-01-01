"use client";

import DashboardLayout from "@/app/[locale]/layouts/DashboardLayout";
import { Button, Card, AccessDenied, Checkbox, Combobox, DataTable, DataTableColumn, Input, useToast, Badge, Modal, Label } from "@underverse-ui/underverse";
import { useAuth } from "@/contexts/AuthContext";
import { APP_ROLE, HTTP_METHOD_ENUM, LOCALE, AppRole } from "@/lib/constants/enum";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { callApi } from "@/lib/utils/api-client";
import { buildActionCapabilities, type ActionCapabilities } from "@/lib/utils/rbac-ui";
import { MenuActionsResponse } from "@/lib/models/rbac-types";
import { Users, UserPlus, Shield, Activity, RefreshCw, UserCheck, AlertCircle, Mail, Info, Loader2, Edit2, Trash2, RotateCcw, Search } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DisableUserConfirmDialog from "./DisableUserConfirmDialog";

export default function UsersContainer() {
  const { user } = useAuth();
  const tu = useTranslations("UsersPage");
  const currentLocale = useLocale();
  // Filter states
  const [filterName, setFilterName] = useState("");
  const [filterUserName, setFilterUserName] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Refs to avoid stale closure in useCallback
  const filtersRef = useRef({ name: "", user_name: "", email: "", role: "all", status: "all" });
  // Keep refs in sync with state
  filtersRef.current = { name: filterName, user_name: filterUserName, email: filterEmail, role: filterRole, status: filterStatus };
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [form, setForm] = useState({ id: 0, name: "", email: "", role: APP_ROLE.USER as AppRole, user_name: "" });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [originalEmail, setOriginalEmail] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [activationLoading, setActivationLoading] = useState<Record<number, boolean>>({});
  const [disableConfirmModal, setDisableConfirmModal] = useState<{ open: boolean; userId: number | null; userName: string }>({ open: false, userId: null, userName: "" });
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const { addToast } = useToast();

  // RBAC capabilities
  const [caps, setCaps] = useState<ActionCapabilities>({
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canDisplay: false,
  });
  const [forbidden, setForbidden] = useState(false);
  const [roles, setRoles] = useState<{ id: number; code: string; name: string; level: number }[]>([]);

  // Legacy checks (keep for role dropdown logic)
  const isAdmin = (user as any)?.role === APP_ROLE.ADMIN || (user as any)?.role === APP_ROLE.SUPER_ADMIN;
  const isSuperAdmin = (user as any)?.role === APP_ROLE.SUPER_ADMIN;

  // Load RBAC capabilities and roles
  const loadSetup = useCallback(async () => {
    try {
      // First, load setup-view for this page
      const setup = await callApi<MenuActionsResponse>(
        API_ROUTES.RBAC.USERS.SETUP_VIEW,
        HTTP_METHOD_ENUM.GET,
        undefined,
        { silent: true }
      );
      const codes = setup.actions || [];
      setCaps(buildActionCapabilities(codes));

      // Then try to load roles (may fail if user doesn't have roles.view permission)
      try {
        const rolesData = await callApi<{ id: number; code: string; name: string; level: number }[]>(
          "/api/rbac/roles",
          HTTP_METHOD_ENUM.GET,
          undefined,
          { silent: true }
        );
        setRoles(rolesData || []);
      } catch (rolesErr: any) {
        setRoles([]);
      }
    } catch (err: any) {
      const message = err?.message || "";
      if (message === "Forbidden") {
        setForbidden(true);
      }
      setCaps(buildActionCapabilities([]));
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const showDeleted = activeTab === "deleted";
      const filters = filtersRef.current;
      const sp = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        showDeleted: String(showDeleted),
        ...(filters.name && { name: filters.name }),
        ...(filters.user_name && { user_name: filters.user_name }),
        ...(filters.email && { email: filters.email }),
        ...(filters.role !== "all" && { role: filters.role }),
        ...(filters.status !== "all" && { status: filters.status }),
      }).toString();
      const res = await callApi<any>(`${API_ROUTES.USERS.LIST}?${sp}`, HTTP_METHOD_ENUM.GET, undefined, { silent: true });
      setUsers(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setUsers([]);
      setTotal(0);
      addToast({ type: "error", message: err?.message || (tu("loadFailed") as string) || "Failed to load users" });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeTab]); // Only depend on page/tab - filters read from ref, search triggered by button

  useEffect(() => {
    loadSetup();
  }, [loadSetup]);

  useEffect(() => {
    if (caps.canView) {
      load();
    } else {
      setLoading(false);
    }
  }, [caps.canView, load]);

  // Compute allowed role options based on current user's role level
  // Level 1 = highest (SuperAdmin), higher number = lower privilege
  // User can only assign roles with level >= their own level
  const allowedRoleOptions = useMemo(() => {
    const currentUserRole = (user as any)?.role;
    const currentUserRoleData = roles.find(r => r.code === currentUserRole);
    const currentUserLevel = currentUserRoleData?.level || 999; // Default to lowest privilege

    return roles
      .filter(r => r.level >= currentUserLevel)
      .sort((a, b) => a.level - b.level)
      .map(r => r.code);
  }, [roles, user]);

  const createUser = async () => {
    // Basic client-side validation
    if (!form.name.trim()) {
      addToast({ type: "error", message: tu("nameRequired") || "Name is required" });
      return;
    }
    if (!form.email.trim()) {
      addToast({ type: "error", message: tu("emailRequired") || "Email is required" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      addToast({ type: "error", message: tu("invalidEmailFormat") || "Invalid email format" });
      return;
    }
    // Existence check via MX/A records
    try {
      const ver = await callApi<any>(API_ROUTES.UTILS.VERIFY_EMAIL, HTTP_METHOD_ENUM.POST, { email: form.email }, { silent: true });
      if (!ver?.exists) {
        addToast({ type: "error", message: (tu("emailNotExist") as string) || "Email does not exist" });
        return;
      }
    } catch {
      // If verification API errors, treat as non-existing to be safe
      addToast({ type: "error", message: (tu("emailNotExist") as string) || "Email does not exist" });
      return;
    }
    setCreating(true);
    try {
      // Get current locale from URL
      const currentLocale = window.location.pathname.split("/")[1] || "en";
      // Use invite API instead of direct user creation
      const payload: any = { name: form.name, email: form.email, role: form.role, locale: currentLocale };
      await callApi("/api/auth/invite", HTTP_METHOD_ENUM.POST, payload);

      addToast({ type: "success", message: tu("inviteSuccess") || "Email mời đã được gửi" });
      setForm({ id: 0, name: "", email: "", role: APP_ROLE.USER, user_name: "" });
      setModalOpen(false);
      await load();
    } catch (err: any) {
      addToast({ type: "error", message: err?.message || tu("inviteFailed") || "Gửi lời mời thất bại" });
    } finally {
      setCreating(false);
    }
  };

  // Open modal for create
  const openCreateModal = () => {
    setModalMode("create");
    setForm({ id: 0, name: "", email: "", role: APP_ROLE.USER, user_name: "" });
    setModalOpen(true);
  };

  // Open modal for edit
  const openEditModal = (userToEdit: any) => {
    setModalMode("edit");
    setForm({
      id: userToEdit.id,
      name: userToEdit.name || "",
      email: userToEdit.email || "",
      role: userToEdit.role || APP_ROLE.USER,
      user_name: userToEdit.user_name || "",
    });
    setOriginalEmail(userToEdit.email || "");
    setModalOpen(true);
  };

  // Update user
  const updateUser = async () => {
    if (!form.name.trim()) {
      addToast({ type: "error", message: tu("nameRequired") || "Name is required" });
      return;
    }
    if (!form.email.trim()) {
      addToast({ type: "error", message: tu("emailRequired") || "Email is required" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      addToast({ type: "error", message: tu("invalidEmailFormat") || "Invalid email format" });
      return;
    }

    const emailChanged = form.email.toLowerCase() !== originalEmail.toLowerCase();

    setCreating(true);
    try {
      // Update user info including email if changed
      await callApi(API_ROUTES.USERS.DETAIL(form.id), HTTP_METHOD_ENUM.PATCH, {
        name: form.name,
        role: form.role,
        email: emailChanged ? form.email : undefined,
        user_name: form.user_name || undefined,
      });

      // If email changed, resend invite to new email
      if (emailChanged) {
        try {
          await callApi("/api/auth/invite/resend", HTTP_METHOD_ENUM.POST, {
            userId: form.id,
            newEmail: form.email,
            locale: currentLocale,
          });
          addToast({ type: "success", message: tu("updateSuccessWithInvite") || "User updated and invitation sent to new email" });
        } catch (inviteErr: any) {
          addToast({ type: "warning", message: tu("updateSuccessInviteFailed") || "User updated but failed to send invitation email" });
        }
      } else {
        addToast({ type: "success", message: tu("updateSuccess") || "User updated successfully" });
      }

      setModalOpen(false);
      await load();
    } catch (err: any) {
      addToast({ type: "error", message: err?.message || tu("updateFailed") });
    } finally {
      setCreating(false);
    }
  };

  const toggleDelete = useCallback(
    async (id: number, isDeleted: boolean) => {
      setActionLoading((prev) => ({ ...prev, [id]: true }));
      try {
        await callApi(API_ROUTES.USERS.DETAIL(id), HTTP_METHOD_ENUM.PATCH, { isDeleted: !isDeleted }, { silent: true });
        await load();
        addToast({ type: "success", message: tu("updateSuccess") });
      } finally {
        setActionLoading((prev) => ({ ...prev, [id]: false }));
      }
    },
    [load, addToast, tu]
  );

  const bulkToggle = async (toDelete: boolean) => {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));
    if (ids.length === 0) return;
    for (const id of ids) {
      await callApi(API_ROUTES.USERS.DETAIL(id), HTTP_METHOD_ENUM.PATCH, { isDeleted: toDelete }, { silent: true });
    }
    setSelected({});
    await load();
  };

  const columns = useMemo<DataTableColumn<any>[]>(
    () => [
      {
        key: "_sel",
        title: (
          <Checkbox
            checked={users.length > 0 && users.every((u) => selected[u.id])}
            onChange={(e: any) => {
              const ck = !!e?.target?.checked;
              const map: Record<number, boolean> = {};
              users.forEach((u) => (map[u.id] = ck));
              setSelected(map);
            }}
          />
        ),
        render: (_v, r) => (
          <Checkbox checked={!!selected[r.id]} onChange={(e: any) => setSelected((s) => ({ ...s, [r.id]: !!e?.target?.checked }))} />
        ),
        width: 36,
      },
      { key: "id", title: "ID", dataIndex: "id", sortable: true, width: 72 },
      {
        key: "name",
        title: tu("name") as string,
        dataIndex: "name",
        sortable: true,
        filter: { type: "text", placeholder: tu("name") as string },
        render: (value, r) => (
          <Link href={`/${(Intl as any).locale || LOCALE.VI}/users/${r.id}`} className="text-primary hover:underline">
            {value}
          </Link>
        ),
      },
      {
        key: "email",
        title: tu("email") as string,
        dataIndex: "email",
        sortable: true,
        filter: { type: "text", placeholder: tu("email") as string },
      },
      {
        key: "role",
        title: tu("role.label") as string,
        dataIndex: "role",
        filter: {
          type: "select",
          options: allowedRoleOptions.length > 0 ? allowedRoleOptions : [APP_ROLE.USER, APP_ROLE.ADMIN, APP_ROLE.SUPER_ADMIN],
          placeholder: tu("role.label") as string,
        },
        render: (_, r) => (
          <Combobox
            options={allowedRoleOptions.length > 0 ? allowedRoleOptions : [APP_ROLE.USER, APP_ROLE.ADMIN]}
            value={r.role}
            onChange={async (value) => {
              try {
                await callApi(API_ROUTES.USERS.DETAIL(r.id), HTTP_METHOD_ENUM.PATCH, { role: value });
                await load();
                addToast({ type: "success", message: tu("updateSuccess") });
              } catch (err: any) {
                addToast({ type: "error", message: err?.message || tu("updateRoleFailed") });
              }
            }}
            disabled={!caps.canUpdate}
            placeholder={tu("role.label") as string}
            size="sm"
            className="min-w-32"
          />
        ),
      },
      {
        key: "status",
        title: tu("status") as string || "Status",
        dataIndex: "status",
        render: (_v, r) => {
          // User is invited if email_verified_at is null (not yet activated)
          const isInvited = r.email_verified_at === null;
          const isDeleted = r.is_deleted;
          const isActive = r.is_active;
          const isLoading = activationLoading[r.id];
          // Allow all users with update permission to toggle (including self)
          const canToggle = caps.canUpdate && !isInvited && !isDeleted;

          // Deleted users - grey badge, not clickable
          if (isDeleted) {
            return <Badge variant="secondary" className="text-xs cursor-default">{tu("statusDeleted") || "Deleted"}</Badge>;
          }

          // Invited users - yellow badge, not clickable
          if (isInvited) {
            return <Badge variant="warning" className="text-xs cursor-default">{tu("invited") || "Invited"}</Badge>;
          }

          // Active/Disabled users - clickable badge to toggle
          const handleToggle = async () => {
            if (!canToggle || isLoading) return;

            // If disabling, show confirmation modal first
            if (isActive) {
              setDisableConfirmModal({ open: true, userId: r.id, userName: r.name });
              return;
            }

            // If enabling, proceed directly
            setActivationLoading((prev) => ({ ...prev, [r.id]: true }));
            try {
              await callApi(API_ROUTES.USERS.DETAIL(r.id), HTTP_METHOD_ENUM.PATCH, { is_active: true });
              await load();
              addToast({ type: "success", message: tu("updateSuccess") });
            } catch (err: any) {
              addToast({ type: "error", message: err?.message || tu("updateFailed") });
            } finally {
              setActivationLoading((prev) => ({ ...prev, [r.id]: false }));
            }
          };

          return (
            <div className="flex items-center gap-2">
              <span
                title={canToggle ? (isActive ? tu("clickToDisable") as string : tu("clickToEnable") as string) : undefined}
                onClick={canToggle ? handleToggle : undefined}
                className={canToggle ? "cursor-pointer" : "cursor-default"}
              >
                <Badge
                  variant={isActive ? "success" : "destructive"}
                  className={`text-xs ${canToggle ? "hover:opacity-80 transition-opacity" : ""}`}
                >
                  {isActive ? tu("statusActive") || "Active" : tu("statusDisabled") || "Disabled"}
                </Badge>
              </span>
              {isLoading && <Loader2 className="animate-spin h-3 w-3 text-muted-foreground" />}
            </div>
          );
        },
        filter: { type: "select", options: [tu("statusActive") as string, tu("statusDisabled") as string, tu("invited") as string], placeholder: tu("status") as string },
        width: 120,
      },
      {
        key: "actions",
        title: tu("actions") as string,
        render: (_v, r) => (
          <div className="flex gap-1">
            {/* Edit */}
            {caps.canUpdate && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => openEditModal(r)}
                title={tu("edit") || "Edit"}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            {/* Resend Invite for INVITED users */}
            {/* Resend Invite for users who haven't verified email */}
            {caps.canCreate && r.email_verified_at === null && (
              <Button
                size="icon"
                variant="ghost"
                onClick={async () => {
                  setActionLoading((prev) => ({ ...prev, [`resend_${r.id}`]: true }));
                  try {
                    const currentLocale = window.location.pathname.split("/")[1] || "en";
                    await callApi("/api/auth/invite/resend", HTTP_METHOD_ENUM.POST, { userId: r.id, locale: currentLocale });
                    addToast({ type: "success", message: tu("resendSuccess") || "Đã gửi lại email mời" });
                  } catch (err: any) {
                    addToast({ type: "error", message: err?.message || tu("resendFailed") || "Gửi lại thất bại" });
                  } finally {
                    setActionLoading((prev) => ({ ...prev, [`resend_${r.id}`]: false }));
                  }
                }}
                disabled={actionLoading[`resend_${r.id}`]}
                title={tu("resendInvite") || "Resend Invite"}
                className="text-info hover:text-info/80"
              >
                {actionLoading[`resend_${r.id}`] ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
              </Button>
            )}
            {/* Delete - only in Active tab */}
            {caps.canDelete && activeTab === "active" && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => toggleDelete(r.id, false)}
                disabled={actionLoading[r.id]}
                title={tu("delete") || "Delete"}
                className="text-destructive hover:text-destructive/80"
              >
                {actionLoading[r.id] ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
            {/* Restore - only in Deleted tab */}
            {caps.canDelete && activeTab === "deleted" && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => toggleDelete(r.id, true)}
                disabled={actionLoading[r.id]}
                title={tu("restore") || "Restore"}
                className="text-success hover:text-success/80"
              >
                {actionLoading[r.id] ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        ),
        width: 120,
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [users, selected, user, tu, isSuperAdmin, activationLoading, actionLoading, load, toggleDelete, addToast, caps, allowedRoleOptions, activeTab]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {forbidden ? (
          <AccessDenied title={tu("forbidden") as string} description={tu("forbidden") as string} />
        ) : (
          <>
            {/* Enhanced Header */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {tu("title") as string}
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-muted-foreground">{tu("subtitle") as string}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {caps.canCreate && (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => openCreateModal()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {tu("create") || "Create"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => load()}
                    disabled={loading}
                    className="hover:bg-info/10 border-info/30 text-info hover:text-info"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    {tu("refresh") || "Refresh"}
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card
                  hoverable
                  className="glass-card shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-float border-2 border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative p-2 rounded-lg">
                      <div className="absolute inset-0 bg-linear-to-br from-primary/30 to-primary/10 rounded-lg blur-md"></div>
                      <Users className="w-5 h-5 text-primary relative z-10" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{total}</div>
                      <div className="text-sm text-muted-foreground">{tu("totalUsers") || "Total Users"}</div>
                    </div>
                  </div>
                </Card>

                <Card
                  hoverable
                  className="glass-card shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-float border-2 border-secondary/20"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative p-2 rounded-lg">
                      <div className="absolute inset-0 bg-linear-to-br from-secondary/30 to-secondary/10 rounded-lg blur-md"></div>
                      <UserCheck className="w-5 h-5 text-secondary relative z-10" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{users.filter((u) => u.is_active).length}</div>
                      <div className="text-sm text-muted-foreground">{tu("activeUsers") || "Active Users"}</div>
                    </div>
                  </div>
                </Card>

                <Card
                  hoverable
                  className="glass-card shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-float border-2 border-accent/20"
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative p-2 rounded-lg">
                      <div className="absolute inset-0 bg-linear-to-br from-accent/30 to-accent/10 rounded-lg blur-md"></div>
                      <Shield className="w-5 h-5 text-accent relative z-10" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {users.filter((u) => u.role === APP_ROLE.ADMIN || u.role === APP_ROLE.SUPER_ADMIN).length}
                      </div>
                      <div className="text-sm text-muted-foreground">{tu("adminUsers") || "Admin Users"}</div>
                    </div>
                  </div>
                </Card>

                <Card
                  hoverable
                  className="glass-card shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-float border-2 border-info/20"
                  style={{ animationDelay: "0.3s" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative p-2 rounded-lg">
                      <div className="absolute inset-0 bg-linear-to-br from-info/30 to-info/10 rounded-lg blur-md"></div>
                      <Activity className="w-5 h-5 text-info relative z-10" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{Object.values(selected).filter(Boolean).length}</div>
                      <div className="text-sm text-muted-foreground">{tu("selected") || "Selected"}</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            {/* User Creation Modal */}
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title={modalMode === "edit" ? (tu("editUser") || "Edit User") : (tu("createUser") || "Create New User")}
              size="md"
            >
              <div className="space-y-4 py-2">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    {tu("name")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder={tu("enterName") || "Enter full name"}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    size="md"
                    className="bg-background border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>

                {/* User Name Field - only in edit mode */}
                {modalMode === "edit" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      {tu("userName") || "Username"}
                    </Label>
                    <Input
                      placeholder={tu("enterUserName") || "Enter username"}
                      value={form.user_name}
                      onChange={(e) => setForm({ ...form, user_name: e.target.value })}
                      size="md"
                      className="bg-background border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    {tu("email")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder={tu("enterEmail") || "Enter email address"}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    size="md"
                    className="bg-background border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                  {modalMode === "edit" && (
                    <p className="text-xs text-warning bg-warning/10 p-2 rounded-md">
                      ⚠️ {tu("emailChangeWarning") || "If you change the email, the system will send a new invitation email to the new address"}
                    </p>
                  )}
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">{tu("role.label")}</Label>
                  <Combobox
                    options={allowedRoleOptions.length > 0 ? allowedRoleOptions : [APP_ROLE.USER, APP_ROLE.ADMIN]}
                    value={form.role}
                    onChange={(value) => setForm({ ...form, role: value as AppRole })}
                    placeholder={tu("selectRole") || "Select user role"}
                    className="w-full bg-background border-border/50"
                    size="md"
                  />
                </div>

                {/* Info about invite flow - only show in create mode */}
                {modalMode === "create" && (
                  <p className="text-xs text-muted-foreground bg-info/10 p-3 rounded-md">
                    ※ {tu("inviteInfo") || "User will receive an invite email and set their password when activating the account."}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setModalOpen(false)} disabled={creating}>
                  {tu("cancel") || "Cancel"}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => modalMode === "edit" ? updateUser() : createUser()}
                  disabled={creating || !form.name.trim() || (modalMode === "create" && !form.email.trim())}
                >
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {modalMode === "edit" ? (tu("save") || "Save") : (tu("create") || "Create")}
                </Button>
              </div>
            </Modal>

            {/* Disable Confirmation Modal */}
            <DisableUserConfirmDialog
              open={disableConfirmModal.open}
              onClose={() => setDisableConfirmModal({ open: false, userId: null, userName: "" })}
              onSuccess={async () => {
                if (disableConfirmModal.userId) {
                  setActivationLoading((prev) => ({ ...prev, [disableConfirmModal.userId!]: true }));
                  await load();
                  setActivationLoading((prev) => ({ ...prev, [disableConfirmModal.userId!]: false }));
                }
              }}
              userId={disableConfirmModal.userId}
              userName={disableConfirmModal.userName}
              currentUserId={(user as any)?.id}
            />

            {/* Enhanced Users Data Table */}
            <Card className="glass-card shadow-lg border-2 border-primary/20">
              <div className="space-y-6">
                {/* Table Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Users className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{tu("usersList") || "Users List"}</h3>
                      <p className="text-sm text-muted-foreground">{tu("manageUsersDesc") || "Manage user accounts, roles, and permissions"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info" className="text-xs">
                      {total} {tu("users") || "users"}
                    </Badge>
                  </div>
                </div>

                {/* Filter Bar */}
                <Card className="p-4 glass-card">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                    {/* Name Filter */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{tu("name") || "Name"}</Label>
                      <Input
                        placeholder={tu("filterName") || "Search by name..."}
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        size="md"
                        className="h-9 bg-background"
                      />
                    </div>

                    {/* Username Filter */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{tu("userName") || "Username"}</Label>
                      <Input
                        placeholder={tu("filterUserName") || "Search by username..."}
                        value={filterUserName}
                        onChange={(e) => setFilterUserName(e.target.value)}
                        size="md"
                        className="h-9 bg-background"
                      />
                    </div>

                    {/* Email Filter */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{tu("email") || "Email"}</Label>
                      <Input
                        placeholder={tu("filterEmail") || "Search by email..."}
                        value={filterEmail}
                        onChange={(e) => setFilterEmail(e.target.value)}
                        size="md"
                        className="h-9 bg-background"
                      />
                    </div>

                    {/* Role Filter */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{tu("role.label") || "Role"}</Label>
                      <Combobox
                        options={["all", APP_ROLE.USER, APP_ROLE.ADMIN, APP_ROLE.SUPER_ADMIN]}
                        value={filterRole}
                        onChange={(val) => setFilterRole(val as string)}
                        placeholder={tu("allRoles") || "All roles"}
                        size="md"
                        className="h-9 w-full"
                      />
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{tu("status") || "Status"}</Label>
                      <Combobox
                        options={["all", "active", "disabled", "invited"]}
                        value={filterStatus}
                        onChange={(val) => setFilterStatus(val as string)}
                        placeholder={tu("allStatus") || "All status"}
                        size="md"
                        className="h-9 w-full"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground invisible">.</Label>
                      <Button
                        size="md"
                        onClick={() => { setPage(1); load(); }}
                        className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        {tu("search") || "Search"}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Bulk Actions Toolbar */}
                {Object.values(selected).filter(Boolean).length > 0 && (
                  <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-warning/10 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-warning" />
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-foreground">
                            {Object.values(selected).filter(Boolean).length} {tu("usersSelected") || "users selected"}
                          </div>
                          <div className="text-muted-foreground">{tu("bulkActionsAvailable") || "Bulk actions available"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Restore - only in Deleted tab */}
                        {activeTab === "deleted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => bulkToggle(false)}
                            disabled={Object.values(selected).filter(Boolean).length === 0}
                            className="border-success/30 text-success hover:bg-success/10 hover:border-success/50"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            {tu("restore")}
                          </Button>
                        )}
                        {/* Delete - only in Active tab */}
                        {activeTab === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => bulkToggle(true)}
                            disabled={Object.values(selected).filter(Boolean).length === 0}
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {tu("delete")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabs for Active/Deleted Users */}
                <div className="flex gap-1 p-1 rounded-lg bg-muted/50 w-fit mb-4">
                  <button
                    onClick={() => {
                      setActiveTab("active");
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "active"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    {tu("activeUsersTab") || "Active Users"}
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("deleted");
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "deleted"
                      ? "bg-destructive text-destructive-foreground shadow-sm"
                      : "text-muted-foreground hover:text-destructive"
                      }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    {tu("deletedUsersTab") || "Deleted Users"}
                  </button>
                </div>

                {/* Data Table */}
                <DataTable<any>
                  className="overflow-x-auto"
                  columns={columns}
                  data={users}
                  loading={loading}
                  total={total}
                  page={page}
                  pageSize={pageSize}
                  labels={{
                    density: (tu("density") as string) || "Density",
                    columns: (tu("columns") as string) || "Columns",
                    compact: (tu("compact") as string) || "Compact",
                    normal: (tu("normal") as string) || "Normal",
                    comfortable: (tu("comfortable") as string) || "Comfortable",
                  }}
                  onQueryChange={(q) => {
                    setPage(q.page);
                    if (q.filters.name !== undefined) setFilterName(q.filters.name);
                    if (q.filters.email !== undefined) setFilterEmail(q.filters.email);
                  }}
                />
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
