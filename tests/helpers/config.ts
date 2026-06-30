import { DEFAULT_UPLOAD_CONFIG } from "@/lib/config/constants";
import type { UploadConfig } from "@/lib/types";

/** Upload config with one ready profile for component tests. */
export function createTestUploadConfig(
  overrides: Partial<UploadConfig> = {},
): UploadConfig {
  return {
    ...DEFAULT_UPLOAD_CONFIG,
    profiles: [
      {
        id: "profile-1",
        label: "Main group",
        apiKey: "test-key",
        creatorId: "12345678",
        creatorType: "group",
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    activeProfileId: "profile-1",
    concurrency: 3,
    maxRetries: 2,
    ...overrides,
  };
}
