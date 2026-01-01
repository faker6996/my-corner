"use client";

import DashboardLayout from "@/app/[locale]/layouts/DashboardLayout";
import { Card, AccessDenied } from "@underverse-ui/underverse";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { useState } from "react";
import NotificationForm from "@/components/admin/notifications/NotificationForm";
import NotificationsHistory from "@/components/admin/notifications/NotificationsHistory";
import { APP_ROLE } from "@/lib/constants/enum";
import { Bell, Users, Send, Activity, RefreshCw } from "lucide-react";
import { Button } from "@underverse-ui/underverse";

export default function NotificationsContainer() {
  const { user } = useAuth();
  const t = useTranslations("AdminNotifications");
  const tc = useTranslations("Common");
  const isAdmin = (user as any)?.role === APP_ROLE.ADMIN || (user as any)?.role === APP_ROLE.SUPER_ADMIN;
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFormSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <AccessDenied
          title={tc("forbidden") || "Access Forbidden"}
          description={t("adminOnly") || "This page is only accessible to administrators."}
          variant="destructive"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t("title") || "Notifications Management"}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-muted-foreground">{t("subtitle") || "Send notifications to users and view notification history"}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshTrigger((prev) => prev + 1)}
                className="hover:bg-info/10 border-info/30 text-info hover:text-info"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {tc("refresh") || "Refresh"}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card hoverable className="bg-card/50 border-primary/20 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{t("broadcastNotifications") || "Broadcast"}</div>
                  <div className="text-sm text-muted-foreground">{t("sendToAllUsers") || "Send to all users"}</div>
                </div>
              </div>
            </Card>

            <Card hoverable className="bg-card/50 border-destructive/20 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Users className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{t("targetedNotifications") || "Targeted"}</div>
                  <div className="text-sm text-muted-foreground">{t("sendToSpecificUsers") || "Send to specific users"}</div>
                </div>
              </div>
            </Card>

            <Card hoverable className="bg-card/50 border-warning/20 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Activity className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{t("emailIntegration") || "Email"}</div>
                  <div className="text-sm text-muted-foreground">{t("emailNotificationSupport") || "Email notification support"}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <NotificationForm onSuccess={handleFormSuccess} />

        {/* Enhanced History Card */}
        <Card className="bg-card/50 border-primary/20 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info/10 rounded-lg">
                  <Activity className="w-5 h-5 text-info" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t("sentListTitle") || "Notification History"}</h3>
                  <p className="text-sm text-muted-foreground">{t("viewSentNotifications") || "View all sent notifications and their status"}</p>
                </div>
              </div>
            </div>
            <NotificationsHistory refreshTrigger={refreshTrigger} />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
