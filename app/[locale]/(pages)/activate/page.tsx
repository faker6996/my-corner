"use client";

import { Suspense } from "react";
import ActivateContainer from "@/components/activate/ActivateContainer";

export default function ActivatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
            <ActivateContainer />
        </Suspense>
    );
}
