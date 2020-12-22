import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
//import classNames from 'classnames';
import { action } from 'mobx';
import { Button } from '@material-ui/core';
import Pagination, { PaginationProps } from '@material-ui/lab/Pagination';

import { getQuery, setQuery } from 'utils';
import SubPage from 'components/SubPage';
import Loading from 'components/Loading';

import { useStore } from 'store';
import { SearchService } from 'service/search';
import { SearchInput } from './helper/SearchInput';

import './index.sass';

export default observer(() => {
  const { snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    page: 0,
    limit: 20 as const,
    query: String(getQuery('query') || ''),
    isSearched: false,
    get showLoading() {
      return !SearchService.state.isFetched || SearchService.state.loading;
    },
  }));

  const search = action(async (newPage: number = 0) => {
    if (!state.query) {
      return;
    }
    state.isSearched = true;
    state.page = newPage;
    setQuery({
      query: state.query,
    });
    await SearchService.search({
      q: state.query,
      cy_termmust: true,
      start: newPage * state.limit,
      num: state.limit,
    });
  });

  const handleChange = action((s: string) => { state.query = s; });

  const handleSearch = () => {
    if (!state.query) {
      snackbarStore.show({
        message: '请输入要搜索的内容',
        type: 'error',
      });
      return;
    }
    search();
  };

  const handleEnter = () => {
    if (!state.query) {
      snackbarStore.show({
        message: '请输入要搜索的内容',
        type: 'error',
      });
      return;
    }
    search();
  };

  const handleChangePage: PaginationProps['onChange'] = (_e, newPage) => {
    search(newPage - 1);
    window.scrollTo(0, 0);
  };

  React.useEffect(() => {
    if (state.query) {
      search();
    }
  }, [state]);

  return (
    <SubPage renderTitle={() => <div>搜索</div>}>
      <div className="search-page">
        <div className="search-box mx-auto">
          <div className="search-toolbar flex items-center justify-center">
            <SearchInput
              className="search-input-box flex-1"
              value={state.query}
              onChange={handleChange}
              onEnter={handleEnter}
            />

            <Button
              className="bg-button-color ml-2"
              variant="contained"
              color="primary"
              onClick={handleSearch}
            >
              搜索
            </Button>
          </div>
        </div>

        {!state.isSearched && !getQuery('query') && (
          <div className="pt-12 pb-16 mt-6 text-gray-99 text-center">
            搜索你感兴趣的内容
          </div>
        )}

        {state.isSearched && (
          <div className="mt-8">
            {!state.showLoading && (<>
              {!SearchService.state.total && (
                <div className="pt-12 pb-16 mt-6 text-gray-99 text-center">
                  没有查询到相关的内容，换个关键词试一试？
                </div>
              )}

              {!!SearchService.state.total && (
                <div className="mt-2 pb-5">
                  <div className="text-gray-99 px-10 pb-2 text-14">
                    在书库中搜索到 <strong>{SearchService.state.total}</strong> 条结果
                  </div>
                  {SearchService.state.resultItems.map((resultItem, index) => {
                    const readerUrl = '';
                    return (
                      <div key={index}>
                        <div className="border-t border-gray-e8 pt-3 pb-5 py-5 px-10 text-14">
                          <a
                            className="flex items-center leading-none py-2 font-bold nice-blue-color text-16"
                            href={readerUrl}
                            //target="_blank"
                          >
                            {/* eslint-disable-next-line react/no-danger */}
                            <div dangerouslySetInnerHTML={{ __html: resultItem.title }} />
                          </a>
                          {resultItem.content && (
                            <div
                              className="pt-1 leading-relaxed text-gray-99 truncate-lines"
                              // eslint-disable-next-line react/no-danger
                              dangerouslySetInnerHTML={{ __html: resultItem.content }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>)}
            {!state.showLoading && SearchService.state.hasMore && (
              <div className="flex justify-center pb-5">
                <Pagination
                  count={Math.ceil(SearchService.state.total / state.limit)}
                  variant="outlined"
                  shape="rounded"
                  page={state.page + 1}
                  onChange={handleChangePage}
                />
              </div>
            )}
            {state.showLoading && (
              <div className="pt-2">
                <Loading />
              </div>
            )}
          </div>
        )}
      </div>
    </SubPage>
  );
});