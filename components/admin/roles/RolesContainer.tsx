"use client";

import DashboardLayout from "@/app/[locale]/layouts/DashboardLayout";
import { AccessDenied, Badge, Button, Card, DataTable, DataTableColumn, Input, useToast } from "@underverse-ui/underverse";
import { useAuth } from "@/contexts/AuthContext";
import { APP_ROLE, HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { callApi } from "@/lib/utils/api-client";
import { buildActionCapabilities, type ActionCapabilities } from "@/lib/utils/rbac-ui";
import { MenuActionsResponse } from "@/lib/models/rbac-types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Shield, RefreshCw, Plus, Edit2, Trash2, Eye } from "lucide-react";
import RoleFormModal from "./RoleFormModal";
import DeleteRoleConfirmDialog from "./DeleteRoleConfirmDialog";

interface Role {
  id: number;
  code: string;
  name: string;
  description?: string;
  level: number;
  is_active?: boolean;
  is_system?: boolean;
}

export default function RolesContainer() {
  const { user } = useAuth();
  const t = useTranslations("RolesPage");
  const { addToast } = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [caps, setCaps] = useState<ActionCapabilities>({
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canDisplay: false,
  });

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const isAdmin = (user as any)?.role === APP_ROLE.ADMIN || (user as any)?.role === APP_ROLE.SUPER_ADMIN;

  const loadSetup = useCallback(async () => {
    try {
      const setup = await callApi<MenuActionsResponse>(API_ROUTES.RBAC.ROLES.SETUP_VIEW, HTTP_METHOD_ENUM.GET, undefined, {
        silent: true,
      });
      const codes = setup.actions || [];
      setCaps(buildActionCapabilities(codes));
    } catch (err: any) {
      setCaps(buildActionCapabilities([]));
      addToast({ type: "error", message: err?.message || t("loadFailed") });
    }
  }, [addToast, t]);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callApi<Role[]>("/api/rbac/roles", HTTP_METHOD_ENUM.GET, undefined, { silent: true });
      setRoles(res || []);
    } catch (err: any) {
      setRoles([]);
      addToast({ type: "error", message: err?.message || t("loadFailed") });
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    if (!isAdmin) return;
    loadSetup();
    loadRoles();
  }, [isAdmin, loadSetup, loadRoles]);

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)
    );
  }, [roles, search]);

  const activeCount = useMemo(() => roles.filter((r) => r.is_active !== false).length, [roles]);

  const handleCreateRole = () => {
    if (!caps.canCreate) return;
    setFormMode("create");
    setSelectedRole(undefined);
    setFormModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    if (!caps.canUpdate) return;
    setFormMode("edit");
    setSelectedRole(role);
    setFormModalOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (!caps.canDelete || role.is_system) return;
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleFormSuccess = () => {
    loadRoles();
  };

  const handleDeleteSuccess = () => {
    loadRoles();
  };

  const handleViewRole = (role: Role) => {
    if (!caps.canView) return;
    setFormMode("view");
    setSelectedRole(role);
    setFormModalOpen(true);
  };

  const columns = useMemo<DataTableColumn<Role>[]>(() => {
    return [
      {
        key: "stt",
        title: "STT" as string,
        width: 60,
        render: (_v, _r, index) => <div className="text-center font-medium text-muted-foreground">{(index || 0) + 1}</div>,
      },
      {
        key: "name",
        title: t("name") as string,
        dataIndex: "name",
        sortable: true,
        render: (value, r) => (
          <div className="space-y-1">
            <div className="font-medium">{value}</div>
            {r.description && <div className="text-xs text-muted-foreground line-clamp-2">{r.description}</div>}
          </div>
        ),
      },
      {
        key: "code",
        title: t("code") as string,
        dataIndex: "code",
        sortable: true,
        render: (value) => <span className="font-mono text-xs bg-muted/60 px-2 py-1 rounded border border-border/40">{value}</span>,
      },
      {
        key: "level",
        title: t("level") as string,
        dataIndex: "level",
        sortable: true,
        width: 200,
      },
      {
        key: "system",
        title: t("system") as string,
        render: (_v, r) =>
          r.is_system ? (
            <Badge variant="secondary" className="text-xs">
              {t("system")}
            </Badge>
          ) : (
            "-"
          ),
        width: 200,
      },
      {
        key: "status",
        title: t("status") as string,
        render: (_v, r) =>
          r.is_active !== false ? (
            <Badge variant="success" className="text-xs">
              {t("activeRoles")}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              inactive
            </Badge>
          ),
        width: 200,
      },
      {
        key: "actions",
        title: t("actions") as string,
        render: (_v, r) => (
          <div className="flex justify-end gap-1">
            {caps.canView && (
              <Button size="icon" variant="ghost" onClick={() => handleViewRole(r)} title={t("view")}>
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {caps.canUpdate && (
              <Button size="icon" variant="ghost" onClick={() => handleEditRole(r)} title={t("edit")}>
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            {caps.canDelete && !r.is_system && (
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDeleteRole(r)}
                title={t("delete")}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ),
        width: 120,
      },
    ];
  }, [t, caps, handleEditRole, handleDeleteRole, handleViewRole]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t("title")}</h1>
                <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {caps.canCreate && (
                <Button size="lg" onClick={handleCreateRole} disabled={loading} variant="primary">
                  <Plus className="w-4 h-4 mr-1" />
                  {t("createRole")}
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={loadRoles}
                disabled={loading}
                className="hover:bg-info/10 border-info/30 text-info hover:text-info"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {t("refresh")}
              </Button>
            </div>
          </div>
        </div>

        {/* Roles table */}
        <Card className="glass-card shadow-lg border-2 border-primary/20">
          <div className="space-y-4">
            <DataTable<Role>
              className="overflow-x-auto"
              data={filteredRoles}
              columns={columns}
              loading={loading}
              total={filteredRoles.length}
              page={1}
              pageSize={filteredRoles.length || 10}
              labels={{
                density: t("density") as string,
                columns: t("columns") as string,
                compact: t("compact") as string,
                normal: t("normal") as string,
                comfortable: t("comfortable") as string,
              }}
            />

            {!loading && filteredRoles.length === 0 && <div className="text-center text-sm text-muted-foreground py-6">{t("noRoles")}</div>}
          </div>
        </Card>
      </div>

      {/* Modals */}
      <RoleFormModal open={formModalOpen} onClose={() => setFormModalOpen(false)} onSuccess={handleFormSuccess} role={selectedRole} mode={formMode} />

      <DeleteRoleConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={handleDeleteSuccess}
        role={roleToDelete}
      />
    </DashboardLayout>
  );
}
