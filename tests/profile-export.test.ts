import { describe, expect, it } from "vitest";
import {
  exportProfileMetadata,
  importProfileMetadata,
} from "@/lib/config/profile-export";
import { createTestUploadConfig } from "@/tests/helpers/config";

const baseConfig = createTestUploadConfig({ maxRetries: 1 });

describe("exportProfileMetadata", () => {
  it("excludes api keys by default", () => {
    const exported = exportProfileMetadata(baseConfig);
    expect(exported.profiles[0]).not.toHaveProperty("apiKey");
  });

  it("includes api keys only when explicitly requested", () => {
    const exported = exportProfileMetadata(baseConfig, { includeApiKeys: true });
    expect(exported.profiles[0]?.apiKey).toBe("test-key");
  });
});

describe("importProfileMetadata", () => {
  it("replaces profiles when merge is false", () => {
    const payload = exportProfileMetadata({
      ...baseConfig,
      profiles: [
        {
          id: "p2",
          label: "Imported",
          apiKey: "",
          creatorId: "99999",
          creatorType: "user",
          createdAt: 2,
          updatedAt: 2,
        },
      ],
      activeProfileId: "p2",
    });

    const next = importProfileMetadata(baseConfig, payload, { merge: false });
    expect(next.profiles).toHaveLength(1);
    expect(next.profiles[0]?.id).toBe("p2");
    expect(next.activeProfileId).toBe("p2");
  });

  it("merges profiles without overwriting existing keys", () => {
    const payload = exportProfileMetadata({
      ...baseConfig,
      profiles: [
        {
          id: "profile-1",
          label: "Renamed label",
          apiKey: "",
          creatorId: "12345678",
          creatorType: "group",
          createdAt: 2,
          updatedAt: 2,
        },
        {
          id: "p3",
          label: "New profile",
          apiKey: "",
          creatorId: "77777",
          creatorType: "user",
          createdAt: 3,
          updatedAt: 3,
        },
      ],
      activeProfileId: "profile-1",
    });

    const next = importProfileMetadata(baseConfig, payload, { merge: true });
    expect(next.profiles).toHaveLength(2);
    const main = next.profiles.find((profile) => profile.id === "profile-1");
    expect(main?.label).toBe("Renamed label");
    expect(main?.apiKey).toBe("test-key");
  });
});
