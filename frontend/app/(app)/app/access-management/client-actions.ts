"use server";

import { generateClientCode as generateClientCodeApi } from "@/lib/access-management/backend";

export async function generateClientCode(): Promise<string> {
  return generateClientCodeApi();
}
