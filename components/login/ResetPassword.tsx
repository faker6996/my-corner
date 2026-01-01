import { Button, Input } from "@underverse-ui/underverse";
import { useLocale } from "@/lib/hooks/useLocale";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { LOCALE } from "@/lib/constants/enum";
import { useTranslations } from "next-intl";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { API_ROUTES } from "@/lib/constants/api-routes";

export default function ResetPassword() {
  /* ---------- hooks ---------- */
  const locale = useLocale();

  const t = useTranslations("ResetPassword"); // namespace mới
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  /* ---------- state ---------- */
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  /* ---------- submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await callApi<null>(API_ROUTES.RESET_PASSWORD.RESET, HTTP_METHOD_ENUM.POST, { token, password }, { silent: true });
      setSuccess(true);
    } catch (_) {
      setMessage(t("errorDefault"));
    }
  };

  /* ---------- UI ---------- */
  if (success) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4 text-center">
        <h2 className="text-xl font-semibold text-success">{t("successTitle")}</h2>

        {/* Button bọc Link với asChild */}
        <Button>
          <Link href={`/${locale}/login`}>{t("backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 p-6">
      <h2 className="text-xl font-semibold">{t("heading")}</h2>

      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("passwordPlaceholder")} required />

      <Button type="submit">{t("submitButton")}</Button>

      {message && <p className="text-sm text-destructive wrap-break-word">{message}</p>}
    </form>
  );
}
