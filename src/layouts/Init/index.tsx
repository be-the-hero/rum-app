import React from 'react';
import fs from 'fs-extra';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';

import { IconButton, Paper } from '@material-ui/core';
import { MdArrowBack } from 'react-icons/md';
import GroupApi from 'apis/group';
import { useStore } from 'store';
import { BOOTSTRAPS } from 'utils/constant';
import * as Quorum from 'utils/quorum';
import sleep from 'utils/sleep';
import useExitNode from 'hooks/useExitNode';
import * as useDatabase from 'hooks/useDatabase';
import * as useOffChainDatabase from 'hooks/useOffChainDatabase';

import { NodeType } from './NodeType';
import { StoragePath } from './StoragePath';
import { StartingTips } from './StartingTips';
import { SetProxyNode } from './SetProxyNode';
import { IApiConfig } from 'store/node';
import { lang } from 'utils/lang';
import { isEmpty } from 'lodash';

import inputPassword from 'standaloneModals/inputPassword';

enum Step {
  NODE_TYPE,
  STORAGE_PATH,

  PROXY_NODE,

  STARTING,
  PREFETCH,
}

const backMap = {
  [Step.NODE_TYPE]: Step.NODE_TYPE,
  [Step.STORAGE_PATH]: Step.NODE_TYPE,
  [Step.PROXY_NODE]: Step.STORAGE_PATH,
  [Step.STARTING]: Step.STARTING,
  [Step.PREFETCH]: Step.PREFETCH,
};

type AuthType = 'login' | 'signup' | 'proxy';

interface Props {
  onInitCheckDone: () => unknown
  onInitSuccess: () => unknown
}

export const Init = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    step: Step.NODE_TYPE,
    authType: null as null | AuthType,
  }));

  const {
    nodeStore,
    groupStore,
    confirmDialogStore,
    snackbarStore,
  } = useStore();
  const exitNode = useExitNode();

  const initCheck = async () => {
    const check = async () => {
      if (!nodeStore.mode) {
        return false;
      }

      if (nodeStore.mode === 'INTERNAL') {
        if (!nodeStore.storagePath || !await fs.pathExists(nodeStore.storagePath)) {
          runInAction(() => { state.authType = null; state.step = Step.NODE_TYPE; });
          return false;
        }
      }

      if (nodeStore.mode === 'EXTERNAL') {
        Quorum.down();
        if (isEmpty(nodeStore.apiConfig)) {
          runInAction(() => { state.authType = null; state.step = Step.NODE_TYPE; });
          return false;
        }
        if (!nodeStore.storagePath || !await fs.pathExists(nodeStore.storagePath)) {
          runInAction(() => { state.authType = null; state.step = Step.NODE_TYPE; });
          return false;
        }
      }
      return true;
    };

    const success = await check();
    props.onInitCheckDone();
    if (success) {
      tryStartNode();
    } else {
      nodeStore.resetNode();
    }
  };

  const tryStartNode = async () => {
    runInAction(() => { state.step = Step.STARTING; });
    const result = nodeStore.mode === 'INTERNAL'
      ? await startInternalNode()
      : await startProxyNode();

    if ('left' in result) {
      return;
    }

    runInAction(() => { state.step = Step.PREFETCH; });
    await prefetch();
    await dbInit();

    props.onInitSuccess();
  };

  const ping = async (retries = 6) => {
    const getInfo = async () => {
      try {
        return {
          right: await GroupApi.fetchMyNodeInfo(),
        };
      } catch (e) {
        return {
          left: e as Error,
        };
      }
    };

    let err = new Error();

    for (let i = 0; i < retries; i += 1) {
      const getInfoPromise = getInfo();
      // await at least 1 sec
      await Promise.all([
        getInfoPromise,
        sleep(1000),
      ]);
      const result = await getInfoPromise;
      if ('right' in result) {
        return result;
      }
      const { data } = await Quorum.getLogs();
      if (data.logs.includes('incorrect passphrase') || data.logs.includes('could not decrypt key with given password')) {
        return { left: new Error('incorrect password') };
      }
      err = result.left;
    }

    return { left: err };
  };

  const startInternalNode = async () => {
    if (nodeStore.status.up) {
      const result = await ping(30);
      if ('left' in result) {
        return result;
      }
    }
    let password = localStorage.getItem(`p${nodeStore.storagePath}`);
    let remember = false;
    if (!password) {
      ({ password, remember } = await inputPassword({ force: true, check: state.authType === 'signup' }));
    }
    const { data: status } = await Quorum.up({
      bootstraps: BOOTSTRAPS,
      storagePath: nodeStore.storagePath,
      password,
    });
    console.log('NODE_STATUS', status);
    nodeStore.setStatus(status);
    nodeStore.setApiConfig({
      port: String(status.port),
      cert: status.cert,
      host: '',
      jwt: '',
    });
    nodeStore.setPassword(password);

    const result = await ping(50);
    if ('left' in result) {
      console.error(result.left);
      const passwordFailed = result?.left?.message.includes('incorrect password');
      confirmDialogStore.show({
        content: passwordFailed ? lang.invalidPassword : lang.failToStartNode,
        okText: passwordFailed ? lang.reEnter : lang.reload,
        ok: () => {
          confirmDialogStore.hide();
          window.location.reload();
        },
        cancelText: lang.exitNode,
        cancel: async () => {
          confirmDialogStore.hide();
          nodeStore.resetNode();
          await exitNode();
          window.location.reload();
        },
      });
    } else if (remember) {
      localStorage.setItem(`p${nodeStore.storagePath}`, password);
    }

    return result;
  };

  const startProxyNode = async () => {
    const { host, port, cert } = nodeStore.apiConfig;
    Quorum.setCert(cert);

    const result = await ping();
    if ('left' in result) {
      console.log(result.left);
      confirmDialogStore.show({
        content: lang.failToAccessProxyNode(host, port),
        okText: lang.tryAgain,
        ok: () => {
          confirmDialogStore.hide();
          window.location.reload();
        },
        cancelText: lang.exitNode,
        cancel: async () => {
          snackbarStore.show({
            message: lang.exited,
          });
          await sleep(1500);
          nodeStore.resetElectronStore();
          nodeStore.resetNode();
          window.location.reload();
        },
      });
    }

    return result;
  };

  const prefetch = async () => {
    try {
      const [info, { groups }, network] = await Promise.all([
        GroupApi.fetchMyNodeInfo(),
        GroupApi.fetchMyGroups(),
        GroupApi.fetchNetwork(),
      ]);

      nodeStore.setInfo(info);
      nodeStore.setNetwork(network);
      if (groups && groups.length > 0) {
        groupStore.addGroups(groups);
      }

      return { right: null };
    } catch (e) {
      return { left: e as Error };
    }
  };

  const dbInit = async () => {
    await Promise.all([
      useDatabase.init(nodeStore.info.node_publickey),
      useOffChainDatabase.init(nodeStore.info.node_publickey),
    ]);
  };

  const handleSelectAuthType = action((v: AuthType) => {
    state.authType = v;
    state.step = Step.STORAGE_PATH;
  });

  const handleSavePath = action((p: string) => {
    nodeStore.setStoragePath(p);
    if (state.authType === 'login' || state.authType === 'signup') {
      nodeStore.setMode('INTERNAL');
      tryStartNode();
    }
    if (state.authType === 'proxy') {
      state.step = Step.PROXY_NODE;
    }
  });

  const handleSetProxyNode = (config: IApiConfig) => {
    nodeStore.setMode('EXTERNAL');
    nodeStore.setApiConfig(config);

    tryStartNode();
  };

  const handleBack = action(() => {
    state.step = backMap[state.step];
  });

  const canGoBack = () => state.step !== backMap[state.step];

  React.useEffect(() => {
    initCheck();
  }, []);

  return (
    <div className="h-full">
      {[Step.NODE_TYPE, Step.STORAGE_PATH, Step.PROXY_NODE].includes(state.step) && (
        <div className="bg-black bg-opacity-50 flex flex-center h-full w-full">
          <Paper
            className="bg-white rounded-0 shadow-3 relative"
            elevation={3}
          >
            {canGoBack() && (
              <IconButton
                className="absolute top-0 left-0 ml-2 mt-2"
                onClick={handleBack}
              >
                <MdArrowBack />
              </IconButton>
            )}

            {state.step === Step.NODE_TYPE && (
              <NodeType
                onSelect={handleSelectAuthType}
              />
            )}

            {state.step === Step.STORAGE_PATH && state.authType && (
              <StoragePath
                authType={state.authType}
                onSelectPath={handleSavePath}
              />
            )}

            {state.step === Step.PROXY_NODE && (
              <SetProxyNode
                onConfirm={handleSetProxyNode}
              />
            )}
          </Paper>
        </div>
      )}

      {[Step.STARTING, Step.PREFETCH].includes(state.step) && (
        <StartingTips />
      )}
    </div>
  );
});
