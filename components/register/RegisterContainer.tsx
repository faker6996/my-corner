import { useAuth } from "@/contexts/AuthContext";
import { FacebookIcon, GoogleIcon } from "@/components/icons/SocialIcons";
import { Input } from "@underverse-ui/underverse";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { callApi } from "@/lib/utils/api-client";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/hooks/useLocale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, useToast } from "@underverse-ui/underverse";
import { loading } from "@/lib/utils/loading";
import { User } from "@/lib/models/user";
import { useState } from "react";

interface SsoReq {
  redirectUrl: string;
}

export default function RegisterContainer() {
  const router = useRouter();
  const { login } = useAuth();
  const locale = useLocale();
  const t = useTranslations("RegisterPage");
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegisterWithFacebook = async () => {
    loading.show(t("social.registeringFacebook"));
    try {
      const res = await callApi<SsoReq>(API_ROUTES.AUTH.SSO_FACEBOOK, HTTP_METHOD_ENUM.POST, { locale, register: true });
      window.location.href = res?.redirectUrl!;
    } catch (err: any) {
      console.error("Facebook SSO register error:", err);
      addToast({
        type: "error",
        message: err?.message || t("errors.facebookRegisterFailed"),
      });
    } finally {
      loading.hide();
    }
  };

  const handleRegisterWithGoogle = async () => {
    loading.show(t("social.registeringGoogle"));
    try {
      const res = await callApi<SsoReq>(API_ROUTES.AUTH.SSO_GOOGLE, HTTP_METHOD_ENUM.POST, { locale, register: true });
      window.location.href = res?.redirectUrl!;
    } catch (err: any) {
      console.error("Google SSO register error:", err);
      addToast({
        type: "error",
        message: err?.message || t("errors.googleRegisterFailed"),
      });
    } finally {
      loading.hide();
    }
  };

  const handleEmailPasswordRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      addToast({
        type: "error",
        message: t("errors.passwordMismatch"),
      });
      return;
    }

    if (formData.password.length < 6) {
      addToast({
        type: "error",
        message: t("errors.passwordTooShort"),
      });
      return;
    }

    loading.show(t("registering"));
    try {
      const registerResult = await callApi<any>(API_ROUTES.AUTH.REGISTER, HTTP_METHOD_ENUM.POST, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // Fetch user data after successful registration
      const userData = await callApi<User>(API_ROUTES.AUTH.ME, HTTP_METHOD_ENUM.GET);
      if (userData) {
        login(userData, null); // Token is stored in cookie, not needed in context
      }

      addToast({
        type: "success",
        message: t("registerSuccess"),
      });

      window.location.href = `/${locale}/dashboard`;
    } catch (err: any) {
      console.error(err);
      addToast({
        type: "error",
        message: t("errors.registerFailed"),
      });
    } finally {
      loading.hide();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo + Heading */}
        <div className="text-center">
          <div className="relative mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full">
            <div className="absolute inset-0 bg-linear-to-br from-primary to-secondary rounded-full blur-md animate-glow-pulse"></div>
            <div className="relative bg-primary text-primary-foreground font-bold text-lg rounded-full h-full w-full flex items-center justify-center">
              OCR
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t("heading")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Form */}
        <div className="rounded-lg glass-card px-6 py-8 shadow-lg sm:px-10 border-2 border-border/20">
          <form className="space-y-6" onSubmit={handleEmailPasswordRegister}>
            <Input
              label={t("nameLabel")}
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border border-border bg-input text-foreground px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />

            <Input
              label={t("emailLabel")}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border border-border bg-input text-foreground px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />

            <Input
              label={t("passwordLabel")}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border border-border bg-input text-foreground px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />

            <Input
              label={t("confirmPasswordLabel")}
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border border-border bg-input text-foreground px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full rounded-md bg-primary text-primary-foreground hover:scale-105 hover:shadow-lg hover:shadow-primary/30 font-medium shadow-sm transition-all duration-200"
            >
              {t("signUpButton")}
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center">
            <div className="w-full border-t border-border" />
            <div className="px-4 text-sm text-muted-foreground whitespace-nowrap">{t("dividerText")}</div>
            <div className="w-full border-t border-border" />
          </div>

          {/* Social Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button onClick={handleRegisterWithGoogle} icon={GoogleIcon} className="hover:scale-105 transition-transform">
              {t("social.google")}
            </Button>
            <Button onClick={handleRegisterWithFacebook} icon={FacebookIcon} className="hover:scale-105 transition-transform">
              {t("social.facebook")}
            </Button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("alreadyHaveAccount")}{" "}
              <Link href={`/${locale}/login`} className="text-primary hover:underline font-medium">
                {t("signInLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
