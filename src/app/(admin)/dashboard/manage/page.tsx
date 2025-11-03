"use client";

import { EnhancedManagePage } from './_enhanced-manage';

export default function ManagePage() {
  return <EnhancedManagePage />;
}

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';