import { describe, expect, it } from "vitest";
import {
  extractSecrets,
  mergeSecrets,
  stripSecrets,
} from "@/lib/config/credential-vault";
import { createTestUploadConfig } from "@/tests/helpers/config";

describe("credential vault helpers", () => {
  it("extracts and merges profile keys and webhook secret", () => {
    const config = createTestUploadConfig({
      webhook: {
        enabled: true,
        url: "https://example.com/hook",
        secret: "whsec_test",
        notifyOnBatchComplete: true,
        useSlackFormat: false,
      },
    });

    const secrets = extractSecrets(config);
    expect(secrets.profileKeys["profile-1"]).toBe("test-key");
    expect(secrets.webhookSecret).toBe("whsec_test");

    const stripped = stripSecrets(config);
    expect(stripped.profiles[0]?.apiKey).toBe("");
    expect(stripped.webhook.secret).toBe("");

    const restored = mergeSecrets(stripped, secrets);
    expect(restored.profiles[0]?.apiKey).toBe("test-key");
    expect(restored.webhook.secret).toBe("whsec_test");
  });
});
