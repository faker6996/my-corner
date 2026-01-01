"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/app/[locale]/layouts/DashboardLayout";
import { Card, Button, Combobox } from "@underverse-ui/underverse";
import { callApi } from "@/lib/utils/api-client";
import { APP_ROLE, HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tu = useTranslations("UsersPage");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const id = Number(params.id as string);

  const isAdmin = (user as any)?.role === APP_ROLE.ADMIN || (user as any)?.role === APP_ROLE.SUPER_ADMIN;
  const isSuperAdmin = (user as any)?.role === APP_ROLE.SUPER_ADMIN;
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <Card className="p-6">{tu("forbidden") as string}</Card>
      </DashboardLayout>
    );
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await callApi<any>(API_ROUTES.USERS.DETAIL(id), HTTP_METHOD_ENUM.GET, undefined, { silent: true });
        setData(res);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <Card className="p-6">{tu("loading") as string}</Card>
      </DashboardLayout>
    );
  }
  if (!data) {
    return (
      <DashboardLayout>
        <Card className="p-6">Not found</Card>
      </DashboardLayout>
    );
  }

  const onToggleDelete = async () => {
    await callApi(API_ROUTES.USERS.DETAIL(id), HTTP_METHOD_ENUM.PATCH, { isDeleted: !data.is_deleted }, { silent: true });
    router.refresh();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {tu("title") as string} #{id}
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.back()}>
              Back
            </Button>
            <Button variant="danger" onClick={onToggleDelete}>
              {data.is_deleted ? (tu("restore") as string) : (tu("delete") as string)}
            </Button>
          </div>
        </div>
        <Card className="p-4 space-y-2">
          <div>
            <strong>{tu("name")}:</strong> {data.name}
          </div>
          <div>
            <strong>{tu("email")}:</strong> {data.email}
          </div>
          <div className="flex items-center gap-2">
            <strong>{tu("role.label")}:</strong>
            <Combobox
              options={[APP_ROLE.USER, APP_ROLE.ADMIN, APP_ROLE.SUPER_ADMIN]}
              value={data.role}
              onChange={async (value) => {
                await callApi(API_ROUTES.USERS.DETAIL(id), HTTP_METHOD_ENUM.PATCH, { role: value }, { silent: true });
                router.refresh();
              }}
              disabled={!isSuperAdmin}
              size="sm"
            />
          </div>
          <div>
            <strong>{tu("active")}:</strong> {data.is_active ? "Yes" : "No"}
          </div>
          <div>
            <strong>{tu("deleted")}:</strong> {data.is_deleted ? "Yes" : "No"}
          </div>
          <div>
            <strong>Created:</strong> {new Date(data.created_at).toLocaleString()}
          </div>
          <div>
            <strong>Updated:</strong> {data.updated_at ? new Date(data.updated_at).toLocaleString() : "-"}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
