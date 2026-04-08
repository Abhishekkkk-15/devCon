import { AxiosResponse } from "axios";
import { api } from "../api";
import { CreateResourcePayload, Resource, ResourceDetails } from "@/types/resource";

interface IContainerService {
  getResources: () => Promise<AxiosResponse<{ resources: Resource[] }>>;
  createResource: (
    payload: CreateResourcePayload
  ) => Promise<AxiosResponse<unknown>>;
  startResource: (id: string) => Promise<AxiosResponse<{ message: string }>>;
  restartResource: (id: string) => Promise<AxiosResponse<{ message: string }>>;
  stopResource: (id: string) => Promise<AxiosResponse<{ message: string }>>;
  deleteResource: (id: string) => Promise<AxiosResponse<{ message: string }>>;
  getResourceDetails: (id: string) => Promise<AxiosResponse<{ resource: ResourceDetails }>>;
  getResourceLogs: (id: string, tail?: number) => Promise<AxiosResponse<{ logs: string }>>;
}

const SERVICE_ENDPOINTS = {
  RESOURCES: () => "/containers/resources",
  CREATE: () => "/containers",
  DETAILS: (id: string) => `/containers/${id}`,
  LOGS: (id: string) => `/containers/${id}/logs`,
  START: (id: string) => `/containers/start/${id}`,
  RESTART: (id: string) => `/containers/restart/${id}`,
  STOP: (id: string) => `/containers/stop/${id}`,
  DELETE: (id: string) => `/containers/${id}`,
};

export const container_service: IContainerService = {
  getResources: async () => api.get(SERVICE_ENDPOINTS.RESOURCES()),
  createResource: async (payload) => {
    const body: Record<string, unknown> = {
      name: payload.name,
      type: payload.type,
    };

    if ('compose' in payload) {
      body.compose = payload.compose;
    } else {
      body.image = payload.image;
      body.containerPort = payload.containerPort;
      body.hostPort = payload.hostPort;
      body.env = payload.env ?? [];
    }

    return api.post(SERVICE_ENDPOINTS.CREATE(), body);
  },
  getResourceDetails: async (id) => api.get(SERVICE_ENDPOINTS.DETAILS(id)),
  getResourceLogs: async (id, tail = 200) =>
    api.get(SERVICE_ENDPOINTS.LOGS(id), { params: { tail } }),
  startResource: async (id) => api.post(SERVICE_ENDPOINTS.START(id)),
  restartResource: async (id) => api.post(SERVICE_ENDPOINTS.RESTART(id)),
  stopResource: async (id) => api.post(SERVICE_ENDPOINTS.STOP(id)),
  deleteResource: async (id) => api.delete(SERVICE_ENDPOINTS.DELETE(id)),
};
