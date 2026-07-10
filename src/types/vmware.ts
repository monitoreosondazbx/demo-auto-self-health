export interface VsphereCluster {
  cluster: string;
  drs_enabled: boolean;
  ha_enabled: boolean;
  name: string;
}

export interface VsphereDatastore {
  capacity: number;
  datastore: string;
  free_space: number;
  name: string;
  type: 'NFS' | 'VMFS';
}

export interface VsphereNetwork {
  available_ips: string[];
  name: string;
  network: string;
  subnet: string;
  type: 'STANDARD_PORTGROUP';
}

export type VsphereFolderType =
  | 'DATACENTER'
  | 'HOST'
  | 'NETWORK'
  | 'DATASTORE'
  | 'VIRTUAL_MACHINE';

export interface VsphereFolder {
  folder: string;
  name: string;
  type: VsphereFolderType;
}

export interface HostDatastoreSummary {
  free: string;
  name: string;
  total: string;
}

export interface VsphereHost {
  cluster: string;
  connection_state: 'connected' | 'disconnected' | 'notResponding';
  cpu_cores: number;
  cpu_model: string;
  cpu_threads: number;
  datastores: HostDatastoreSummary[];
  esxi_build: string;
  esxi_version: string;
  maintenance_mode: boolean;
  memory_free_mb: number;
  memory_total_mb: number;
  model: string;
  name: string;
  vendor: string;
  vm_count: number;
}

export interface VsphereResourcePool {
  name: string;
  owner: string;
  overall_status: 'green' | 'yellow' | 'red';
  cpu_allocation_expandable_reservation: boolean;
  cpu_allocation_limit: number;
  cpu_allocation_overhead_limit: number | null;
  cpu_allocation_reservation: number;
  cpu_allocation_shares: number;
  cpu_allocation_shares_level: string;
  mem_allocation_expandable_reservation: boolean;
  mem_allocation_limit: number;
  mem_allocation_overhead_limit: number | null;
  mem_allocation_reservation: number;
  mem_allocation_shares: number;
  mem_allocation_shares_level: string;
  runtime_cpu_max_usage: number;
  runtime_cpu_overall_usage: number;
  runtime_cpu_reservation_used: number;
  runtime_cpu_reservation_used_vm: number;
  runtime_cpu_unreserved_for_pool: number;
  runtime_cpu_unreserved_for_vm: number;
  runtime_memory_max_usage: number;
  runtime_memory_overall_usage: number;
  runtime_memory_reservation_used: number;
  runtime_memory_reservation_used_vm: number;
  runtime_memory_unreserved_for_pool: number;
  runtime_memory_unreserved_for_vm: number;
}

export interface VsphereInfrastructure {
  clusters: VsphereCluster[];
  datastores: VsphereDatastore[];
  networks: VsphereNetwork[];
  folders: VsphereFolder[];
  hosts: VsphereHost[];
  templates: string[];
  resource_pools: VsphereResourcePool[];
}
