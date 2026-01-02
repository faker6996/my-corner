"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/lib/models/user";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/utils/local-storage";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { APP_ROLE, HTTP_METHOD_ENUM } from "@/lib/constants/enum";

interface AuthContextType {
  user: User | null;
  login: (user: User, token?: string | null) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);

      // Skip auth check if on login/register/public pages
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const isPublicPage = ["/login", "/register", "/forgot-password", "/reset-password", "/dashboard", "/403", "/activate"].some((path) =>
        currentPath.includes(path)
      );

      if (isPublicPage) {
        setLoading(false);
        return;
      }

      const cachedUser = loadFromLocalStorage<User>(APP_ROLE.USER, User);

      if (cachedUser) {
        setUser(cachedUser);
      }

      // Always try to verify with server (token in cookie)
      try {
        const freshUser = await callApi<User>(API_ROUTES.AUTH.ME, HTTP_METHOD_ENUM.GET, undefined, { silent: true });
        if (freshUser) {
          setUser(freshUser);
          saveToLocalStorage(APP_ROLE.USER, freshUser);
        }
      } catch (error) {
        // Only logout if we had a cached user (user was previously logged in)
        if (cachedUser) {
          console.error("Session validation failed, logging out.", error);
          logoutUser();
        } else {
          // First time visitors without cached user - this is expected
          console.log("No valid session found, user needs to login");
        }
      }

      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = (newUser: User, _token?: string | null) => {
    setUser(newUser);
    saveToLocalStorage(APP_ROLE.USER, newUser);
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem(APP_ROLE.USER);
    // Token is in cookie, will be cleared by logout API
  };

  return <AuthContext.Provider value={{ user, login, logout: logoutUser, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
