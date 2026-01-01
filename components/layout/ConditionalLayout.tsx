"use client";

import { usePathname } from 'next/navigation';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

// This client component only decides whether to alter layouting in the future.
// To avoid SSR/CSR hydration mismatches, it must not set structural attributes.
export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  // We keep pathname in case future logic needs it, but we do not
  // conditionally change the DOM structure or attributes here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pathname = usePathname();

  // Render children as-is; layout wrappers live in the server layout.
  return children as React.ReactElement;
}
