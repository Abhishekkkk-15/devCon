import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export const api = axios.create({
  baseURL: BASE_URL ? BASE_URL : "http://localhost:8080/api/v1",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const raw = window.localStorage.getItem("devcon.workspace.state");
  if (!raw) {
    return config;
  }

  try {
    const parsed = JSON.parse(raw) as {
      workspaces?: Array<{ id: string; slug: string }>;
      currentWorkspaceId?: string;
    };

    const workspace = parsed.workspaces?.find(
      (item) => item.id === parsed.currentWorkspaceId
    );

    if (workspace?.slug) {
      config.headers["x-workspace-slug"] = workspace.slug;
    }
  } catch {
    return config;
  }

  return config;
});
