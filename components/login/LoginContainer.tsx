import { useAuth } from "@/contexts/AuthContext";
import { FacebookIcon, GoogleIcon } from "@/components/icons/SocialIcons";
import { Input, Checkbox, useToast, Button } from "@underverse-ui/underverse";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { HTTP_METHOD_ENUM, LOCALE } from "@/lib/constants/enum";
import { callApi } from "@/lib/utils/api-client";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/hooks/useLocale";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loading } from "@/lib/utils/loading";
import { User } from "@/lib/models/user";

interface SsoReq {
  redirectUrl: string;
}

export default function LoginContainer() {
  const router = useRouter();
  const { login } = useAuth();
  const locale = useLocale();
  const t = useTranslations("LoginPage");
  const { addToast } = useToast();

  const handleLoginWithFacebook = async () => {
    loading.show(t("social.loggingInFacebook"));
    try {
      const res = await callApi<SsoReq>(API_ROUTES.AUTH.SSO_FACEBOOK, HTTP_METHOD_ENUM.POST, { locale });
      window.location.href = res?.redirectUrl!;
    } catch (err: any) {
      console.error("Facebook SSO error:", err);
      addToast({
        type: "error",
        message: err?.message || t("errors.facebookLoginFailed"),
      });
    } finally {
      loading.hide();
    }
  };

  const handleLoginWithGoogle = async () => {
    loading.show(t("social.loggingInGoogle"));
    try {
      const res = await callApi<SsoReq>(API_ROUTES.AUTH.SSO_GOOGLE, HTTP_METHOD_ENUM.POST, { locale });
      window.location.href = res?.redirectUrl!;
    } catch (err: any) {
      console.error("Google SSO error:", err);
      addToast({
        type: "error",
        message: err?.message || t("errors.googleLoginFailed"),
      });
    } finally {
      loading.hide();
    }
  };
  const handleEmailPasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const rememberMe = form.get("rememberMe") === "on";

    loading.show(t("loggingIn"));
    try {
      const loginResult = await callApi<any>(API_ROUTES.AUTH.LOGIN, HTTP_METHOD_ENUM.POST, {
        email,
        password,
        rememberMe,
      });

      // Fetch user data after successful login
      const userData = await callApi<User>(API_ROUTES.AUTH.ME, HTTP_METHOD_ENUM.GET);
      if (userData) {
        login(userData, null); // Token is stored in cookie, not needed in context
      }

      addToast({
        type: "success",
        message: t("loginSuccess"),
      });

      window.location.href = `/${locale}/dashboard`;
    } catch (err: any) {
      console.error(err);
      addToast({
        type: "error",
        message: t("errors.loginFailed"),
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
          <div className="relative mx-auto mb-3 h-10 w-10 flex items-center justify-center rounded-lg">
            <div className="absolute inset-0 bg-linear-to-br from-primary/30 to-secondary/30 rounded-lg blur-md"></div>
            <div className="relative bg-primary/10 h-full w-full rounded-lg flex items-center justify-center">
              <Image src="/ocr-logo.svg" alt="OCR Editor logo" width={28} height={28} priority />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-balance bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t("heading")}
          </h2>
        </div>

        {/* Form */}
        <div className="rounded-xl glass-card px-6 py-8 shadow-lg sm:px-10 border-2 border-border/20">
          <form className="space-y-6" onSubmit={handleEmailPasswordLogin}>
            <Input
              label={t("emailLabel")}
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-border bg-input text-foreground px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />

            <Input
              label={t("passwordLabel")}
              type="password"
              name="password"
              required
              className="mt-1 block w-full rounded-md border border-border bg-input text-foreground px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />

            <div className="flex items-center justify-between">
              <Checkbox name="rememberMe" label={<span className="text-sm text-muted-foreground">{t("rememberMe")}</span>} />
              <Link href={`/${locale}/forgot-password`} className="text-sm text-primary hover:underline font-medium">
                {t("forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full rounded-md bg-primary text-primary-foreground hover:scale-105 hover:shadow-lg hover:shadow-primary/30 font-medium shadow-sm transition-all duration-200"
            >
              {t("signInButton")}
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
            <Button onClick={handleLoginWithGoogle} icon={GoogleIcon} className="hover:scale-105 transition-transform">
              {t("social.google")}
            </Button>
            <Button onClick={handleLoginWithFacebook} icon={FacebookIcon} className="hover:scale-105 transition-transform">
              {t("social.facebook")}
            </Button>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("dontHaveAccount")}{" "}
              <Link href={`/${locale}/register`} className="text-primary hover:underline font-medium">
                {t("signUpLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
