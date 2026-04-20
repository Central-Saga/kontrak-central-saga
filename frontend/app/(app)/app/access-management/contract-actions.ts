"use server";

import { generateContractCode as generateContractCodeApi } from "@/lib/access-management/backend";

export async function generateContractCode(): Promise<string> {
  return generateContractCodeApi();
}
