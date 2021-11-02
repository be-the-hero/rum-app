import React from 'react';
import { observer } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import ObjectEditor from '../ObjectEditor';
import Profile from '../Profile';
import { useStore } from 'store';
import Button from 'components/Button';
import { ObjectsFilterType } from 'store/activeGroup';
import useActiveGroupLatestStatus from 'store/selectors/useActiveGroupLatestStatus';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import ObjectItem from './ObjectItem';

interface Props {
  loadingMore: boolean
  isFetchingUnreadObjects: boolean
  fetchUnreadObjects: () => void
}

export default observer((props: Props) => {
  const { activeGroupStore, nodeStore } = useStore();
  const { objectsFilter } = activeGroupStore;
  const { unreadCount } = useActiveGroupLatestStatus();

  return (
    <div className="w-full lg:w-[600px] mx-auto">
      <div className='box-border px-5 lg:px-0'>
        <Fade in={true} timeout={350}>
          <div>
            {objectsFilter.type === ObjectsFilterType.ALL && <ObjectEditor />}
            {objectsFilter.type === ObjectsFilterType.SOMEONE && (
              <Profile publisher={objectsFilter.publisher || ''} />
            )}
          </div>
        </Fade>

        {objectsFilter.type === ObjectsFilterType.ALL && unreadCount > 0 && (
          <div className="relative w-full">
            <div className="flex justify-center absolute left-0 w-full -top-2 z-10">
              <Fade in={true} timeout={350}>
                <div>
                  <Button className="shadow-xl" onClick={props.fetchUnreadObjects}>
                    收到新的内容
                    {props.isFetchingUnreadObjects ? ' ...' : ''}
                  </Button>
                </div>
              </Fade>
            </div>
          </div>
        )}

        {activeGroupStore.objectTotal === 0
          && !activeGroupStore.searchText
          && objectsFilter.type === ObjectsFilterType.SOMEONE && (
          <Fade in={true} timeout={350}>
            <div className="pt-16 text-center text-14 text-gray-400 opacity-80">
              {objectsFilter.type === ObjectsFilterType.SOMEONE
                  && objectsFilter.publisher === nodeStore.info.node_publickey
                  && '发布你的第一条内容吧 ~'}
            </div>
          </Fade>
        )}
      </div>

      <div className="w-full box-border px-5 lg:px-0">
        <Objects />
        {props.loadingMore && (
          <div className="pt-3 pb-6 text-center text-12 text-gray-400 opacity-80">
            加载中 ...
          </div>
        )}
        {!props.loadingMore
          && !activeGroupStore.hasMoreObjects
          && activeGroupStore.objectTotal > 5 && (
          <div className="pt-2 pb-6 text-center text-12 text-gray-400 opacity-80">
            没有更多内容了哦
          </div>
        )}
      </div>

      {activeGroupStore.objectTotal === 0
        && activeGroupStore.searchText && (
        <Fade in={true} timeout={350}>
          <div className="pt-32 text-center text-14 text-gray-400 opacity-80">
            没有搜索到相关的内容 ~
          </div>
        </Fade>
      )}
    </div>
  );
});

const Objects = observer(() => {
  const { activeGroupStore } = useStore();
  const { objectsFilter } = activeGroupStore;

  return (
    <div className="pb-4">
      {activeGroupStore.objects.map((object: IDbDerivedObjectItem) => (
        <div key={object.TrxId}>
          <Fade in={true} timeout={300}>
            <div>
              {activeGroupStore.latestObjectTimeStampSet.has(
                object.TimeStamp,
              )
                && objectsFilter.type === ObjectsFilterType.ALL
                && !activeGroupStore.searchText && (
                <div className="w-full text-12 text-center py-3 text-gray-400">
                  上次看到这里
                </div>
              )}
              <ObjectItem
                object={object}
                withBorder
                disabledUserCardTooltip={
                  objectsFilter.type === ObjectsFilterType.SOMEONE
                }
              />
            </div>
          </Fade>
        </div>
      ))}
    </div>
  );
});
