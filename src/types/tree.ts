import type {
  VsphereCluster,
  VsphereHost,
  VsphereDatastore,
  VsphereFolder,
  VsphereNetwork,
} from './vmware';

export type TreeNodeKind =
  | 'section'
  | 'cluster'
  | 'host'
  | 'datastore'
  | 'folder'
  | 'network';

export interface TreeNodeData {
  id: string;
  kind: TreeNodeKind;
  label: string;
  sublabel?: string;
  badge?: string;
  statusDot?: 'green' | 'amber' | 'red';
  children?: TreeNodeData[];
  rawCluster?: VsphereCluster;
  rawHost?: VsphereHost;
  rawDatastore?: VsphereDatastore;
  rawFolder?: VsphereFolder;
  rawNetwork?: VsphereNetwork;
}
