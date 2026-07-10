export interface VmCreationPayload {
  vm_name: string;
  template: string;
  folder: string;
  host: string;
  datastore: string;
  cpu: number;
  memory_gb: number;
  disk_gb: number;
  guest_username: string;
  guest_password: string;
  network: string;
  ip: string;
}
