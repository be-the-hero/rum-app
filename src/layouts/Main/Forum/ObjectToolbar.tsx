import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import { RiAddLine } from 'react-icons/ri';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import OpenEditor from './OpenEditor';
import { useStore } from 'store';
import classNames from 'classnames';
import { lang } from 'utils/lang';

export default observer(() => {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const { activeGroupStore } = useStore();
  const hasObject = activeGroupStore.objectTotal > 0;
  return (
    <div
      ref={rootRef}
      className={classNames({
        'justify-center py-10 px-8': !hasObject,
        'justify-between pr-4 py-[10px]': hasObject,
      }, 'bg-white flex items-center w-full mb-4')}
    >
      <div className="hidden">
        <Filter />
      </div>
      {hasObject && (
        <div className="text-gray-700 text-15 leading-5 tracking-wide pl-6">
          {lang.latestForumPost}
        </div>
      )}
      <div>
        <Button
          size="mini"
          onClick={() => {
            OpenEditor();
          }}
        >
          <RiAddLine className="ml-[-3px] mr-[1px] opacity-80 text-16" />
          {hasObject ? lang.createForumPost : lang.createFirstForumPost}
        </Button>
      </div>
    </div>
  );
});

const Filter = observer(() => {
  const state = useLocalObservable(() => ({
    tab: 0,
  }));

  return (
    <div>
      <Tabs
        className="forum-tabs"
        value={state.tab}
        onChange={(_e, newTab) => {
          state.tab = newTab;
        }}
      >
        <Tab label={lang.sortByHot} />
        <Tab label={lang.sortByDate} />
      </Tabs>
      <style jsx global>{`
        .forum-tabs, .forum-tabs .MuiTabs-fixed {
          overflow: visible !important;
        }
        .forum-tabs .MuiTab-root {
          height: 38px !important;
          padding-left: 18px !important;
          padding-right: 18px !important;
          margin-right: 0 !important;
        }
        .forum-tabs .MuiTabs-indicator {
          bottom: 40px
        }
      `}</style>
    </div>
  );
});
