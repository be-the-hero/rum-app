import React from 'react';
import { useStore } from 'store';
import GroupApi, { ContentTypeUrl } from 'apis/group';
import { sleep } from 'utils';
import useDatabase from 'hooks/useDatabase';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import * as ObjectModel from 'hooks/useDatabase/models/object';

export default () => {
  const { activeGroupStore, nodeStore } = useStore();
  const database = useDatabase();

  const submitObject = React.useCallback(async (content: string) => {
    const payload = {
      type: 'Add',
      object: {
        type: 'Note',
        content,
        name: '',
      },
      target: {
        id: activeGroupStore.id,
        type: 'Group',
      },
    };
    const res = await GroupApi.postContent(payload);
    await sleep(800);
    const object = {
      GroupId: activeGroupStore.id,
      TrxId: res.trx_id,
      Publisher: nodeStore.info.node_publickey,
      Content: {
        type: payload.object.type,
        content: payload.object.content,
      },
      TypeUrl: ContentTypeUrl.Object,
      TimeStamp: Date.now() * 1000000,
      Status: ContentStatus.syncing,
    };
    await ObjectModel.create(database, object);
    const dbObject = await ObjectModel.get(database, {
      TrxId: object.TrxId,
      currentPublisher: object.Publisher,
    });
    if (dbObject) {
      activeGroupStore.addObject(dbObject, {
        isFront: true,
      });
    }
  }, []);

  return submitObject;
};
