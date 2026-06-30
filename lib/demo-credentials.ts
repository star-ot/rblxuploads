import type { CredentialProfile, UploadConfig } from "@/lib/types";

/** Sample profiles for landing demos — not real secrets. */
export const DEMO_CREDENTIAL_PROFILES: CredentialProfile[] = [
  {
    id: "demo-profile-personal",
    label: "Personal account",
    apiKey: "demo-sk-live-personal-7f3a9c2e",
    creatorId: "184729301",
    creatorType: "user",
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: "demo-profile-main-group",
    label: "Main studio group",
    apiKey: "demo-sk-live-group-main-4b8e1d0f",
    creatorId: "2847291",
    creatorType: "group",
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: "demo-profile-qa-group",
    label: "QA staging group",
    apiKey: "demo-sk-live-group-qa-9c2a6f11",
    creatorId: "9182734",
    creatorType: "group",
    createdAt: 1,
    updatedAt: 1,
  },
];

export const DEMO_UPLOAD_CONFIG: UploadConfig = {
  profiles: DEMO_CREDENTIAL_PROFILES,
  activeProfileId: "demo-profile-main-group",
  concurrency: 4,
  maxRetries: 2,
};

/** Static label for hero mock chrome — matches default demo active profile. */
export const DEMO_HERO_CREDENTIAL_LABEL = "Main studio group";
export const DEMO_HERO_CREDENTIAL_BADGE = "GRP";
export const DEMO_HERO_CREATOR_ID = "2847291";
