export interface SsePhaseConfig {
  id: number;
  label: string;
  subtext: string;
  minProgress: number;
  maxProgress: number;
}

export type SseStatus =
  | 'validando_recursos'
  | 'success'
  | 'clonacion_ok'
  | 'completado_ok'
  | 'despliegue_completado'
  | 'despliegue_y_comando_ok'
  | `error_${string}`;

export interface SseChunk {
  progress: number;
  status: SseStatus;
  message: string;
}

export type PhaseStatus = 'pending' | 'active' | 'completed' | 'error';

export interface PhaseState extends SsePhaseConfig {
  status: PhaseStatus;
}

export const SSE_PHASES: SsePhaseConfig[] = [
  {
    id: 1,
    label: 'Iniciando Validación',
    subtext: 'Conectando con vCenter y verificando parámetros de entrada.',
    minProgress: 0,
    maxProgress: 20,
  },
  {
    id: 2,
    label: 'Validación de Recursos',
    subtext: 'Verificando capacidad de hardware y nombres en datastores.',
    minProgress: 21,
    maxProgress: 40,
  },
  {
    id: 3,
    label: 'Aprovisionamiento vCenter',
    subtext: 'Clonando máquina virtual desde plantilla e insuflando configuraciones base.',
    minProgress: 41,
    maxProgress: 60,
  },
  {
    id: 4,
    label: 'Encendido y Estabilización',
    subtext: 'Arrancando sistema operativo y esperando inicialización de VMware Tools.',
    minProgress: 61,
    maxProgress: 70,
  },
  {
    id: 5,
    label: 'Verificación — Login',
    subtext: 'Validando acceso SSH y credenciales de administración.',
    minProgress: 71,
    maxProgress: 90,
  },
  {
    id: 6,
    label: 'Ejecución de Comandos Internos',
    subtext: 'Inyectando comandos de control operativo internos.',
    minProgress: 91,
    maxProgress: 100,
  },
];
