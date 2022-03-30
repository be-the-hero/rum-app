import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import { ObjectsFilterType } from 'store/activeGroup';
import { useStore } from 'store';
import { lang } from 'utils/lang';

export default observer(() => {
  const { activeGroupStore } = useStore();
  const { objectsFilter } = activeGroupStore;
  const filterType = objectsFilter.type;
  const itemsClassName = 'fixed top-[136px] left-0 ml-[318px] lg:block xl:left-[50%] xl:ml-[-274px] cursor-pointer bg-white rounded-0 z-10';
  const itemClassName = 'flex items-center justify-center text-gray-88 px-7 py-2 relative leading-none';

  const Item = (current: ObjectsFilterType, filterType: ObjectsFilterType, index: number) => (
    <div
      key={filterType}
      className={classNames(
        {
          'font-bold': current === filterType,
          'opacity-80': current !== filterType,
          'mt-[6px]': index !== 0,
        },
        itemClassName,
      )}
      onClick={() => {
        if (current === filterType) {
          return;
        }
        if (filterType === ObjectsFilterType.ALL) {
          activeGroupStore.setObjectsFilter({
            type: ObjectsFilterType.ALL,
          });
        } else if (filterType === ObjectsFilterType.FOLLOW) {
          activeGroupStore.setObjectsFilter({
            type: ObjectsFilterType.FOLLOW,
            publishers: activeGroupStore.followings,
          });
        }
      }}
    >
      {current === filterType && (
        <div className="absolute top-0 left-[15px] flex items-center py-3 h-full">
          <div className="h-[14px] w-1 bg-black opacity-60" />
        </div>
      )}
      {filterType === ObjectsFilterType.ALL && lang.all}
      {filterType === ObjectsFilterType.FOLLOW && lang.follow}
    </div>
  );

  return (
    <div>
      {[ObjectsFilterType.ALL, ObjectsFilterType.FOLLOW].includes(filterType) && (
        <div>
          <Fade in={true} timeout={800}>
            <div className={`${itemsClassName} py-3`}>
              {[ObjectsFilterType.ALL, ObjectsFilterType.FOLLOW].map((_filterType, index) =>
                Item(filterType, _filterType, index))}
            </div>
          </Fade>
        </div>
      )}
      {[ObjectsFilterType.SOMEONE].includes(filterType) && (
        <div>
          <Fade in={true} timeout={1000}>
            <div className={`${itemsClassName} py-2`}>
              <div
                className={itemClassName}
                onClick={() => {
                  activeGroupStore.setObjectsFilter({
                    type: ObjectsFilterType.ALL,
                  });
                }}
              >
                {lang.back}
              </div>
            </div>
          </Fade>
        </div>
      )}
    </div>
  );
});
