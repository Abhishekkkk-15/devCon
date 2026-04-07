export type ResourceType = "compute" | "postgres" | "redis" | "custom";

export type ResourceStatus = "CREATED" | "CREATING" | "RUNNING" | "STOPPED" | "EXITED" | "ERROR";

export interface Resource {
  id: string;
  name: string;
  image: string;
  type: ResourceType;
  status: ResourceStatus;
  created_at: number;
  host_ports: string[];
  container_ports: string[];
}

interface BaseResourcePayload {
  name: string;
  type: ResourceType;
}

interface ContainerResourcePayload extends BaseResourcePayload {
  image: string;
  containerPort: string;
  hostPort: string;
  env?: string[];
}

interface CustomResourcePayload extends BaseResourcePayload {
  compose: string;
}

export type CreateResourcePayload = ContainerResourcePayload | CustomResourcePayload;
