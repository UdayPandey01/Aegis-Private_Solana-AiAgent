"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isAuthenticating } = useAuth();

    useEffect(() => {
        if (isAuthenticating) {
            console.log("Authenticating with backend...");
        } else if (isAuthenticated) {
            console.log("Authenticated with backend");
        }
    }, [isAuthenticated, isAuthenticating]);

    return <>{children}</>;
}

