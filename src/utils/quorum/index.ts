import { sendRequest } from './request';
import { IBootstrap } from 'utils/constant';

import sleep from 'utils/sleep';

export interface ProcessStatus {
  up: boolean
  bootstrapId: string
  storagePath: string
  port: number
  cert: string
  quorumUpdating: boolean
}

export const getStatus = () =>
  sendRequest<ProcessStatus>({
    action: 'status',
  });

export const getLogs = () =>
  sendRequest<{ logs: string }>({
    action: 'logs',
  });

export interface UpParam {
  bootstraps: IBootstrap[]
  storagePath: string
  password: string
}

export interface ImportKeyParam {
  backupPath: string
  storagePath: string
  password: string
}

export const up = (param: UpParam) =>
  sendRequest<ProcessStatus>({
    action: 'up',
    param,
  });

export const down = async () => {
  sendRequest<ProcessStatus>({
    action: 'down',
  });
  await sleep(4000);
};

export const setCert = async (cert: string) => {
  sendRequest({
    action: 'set_cert',
    param: {
      cert,
    },
  });
  await sleep(4000);
};

export const importKey = (param: ImportKeyParam) =>
  sendRequest<string>({
    action: 'importKey',
    param,
  });
