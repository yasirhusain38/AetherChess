import { NextResponse } from "next/server";
import {
  getEnabledSocialProviders,
  socialProviderCatalog,
} from "@/lib/auth/providers";

export async function GET() {
  const enabled = getEnabledSocialProviders();
  return NextResponse.json({
    enabled,
    providers: socialProviderCatalog(enabled),
    credentials: true,
  });
}
