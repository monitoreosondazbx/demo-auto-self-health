'use client';

import { useState, useEffect } from 'react';

let _isDeploying = false;
const _listeners = new Set<(v: boolean) => void>();

export function setDeployingState(v: boolean): void {
  _isDeploying = v;
  _listeners.forEach((fn) => fn(v));
}

export function useDeployingState(): boolean {
  const [state, setState] = useState(_isDeploying);

  useEffect(() => {
    setState(_isDeploying);
    _listeners.add(setState);
    return () => {
      _listeners.delete(setState);
    };
  }, []);

  return state;
}
