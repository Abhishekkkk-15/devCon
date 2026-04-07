import { AxiosResponse } from "axios";
import { api } from "../api";
import { CreateResourcePayload, Resource } from "@/types/resource";

interface IContainerService {
  getResources: () => Promise<AxiosResponse<{ resources: Resource[] }>>;
  createResource: (
    payload: CreateResourcePayload
  ) => Promise<AxiosResponse<unknown>>;
  startResource: (id: string) => Promise<AxiosResponse<{ message: string }>>;
  stopResource: (id: string) => Promise<AxiosResponse<{ message: string }>>;
  deleteResource: (id: string) => Promise<AxiosResponse<{ message: string }>>;
}

const SERVICE_ENDPOINTS = {
  RESOURCES: () => "/containers/resources",
  CREATE: () => "/containers",
  START: (id: string) => `/containers/start/${id}`,
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
  startResource: async (id) => api.post(SERVICE_ENDPOINTS.START(id)),
  stopResource: async (id) => api.post(SERVICE_ENDPOINTS.STOP(id)),
  deleteResource: async (id) => api.delete(SERVICE_ENDPOINTS.DELETE(id)),
};
