import React from 'react';
import { Link } from 'react-router-dom';
import { observer, useLocalStore } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import Button from 'components/Button';
import Posts from 'components/Posts';
import Filter from 'components/PostsFilter';
import FolderGrid from 'components/FolderGrid';
import { isMobile, isPc, sleep } from 'utils';
import { useStore } from 'store';
import TopicContributionModal from './TopicContributionModal';
import TopicPostManagerModal from './TopicPostManagerModal';
import TopicEditorModal from 'components/TopicEditorModal';
import Loading from 'components/Loading';
import topicApi, { ITopic } from 'apis/topic';
import { FilterType } from 'apis/post';
import _ from 'lodash';
import useWindowInfiniteScroll from 'hooks/useWindowInfiniteScroll';
import marked from 'marked';
import ArrowForwardIos from '@material-ui/icons/ArrowForwardIos';
import TopicIntroductionModal from './TopicIntroductionModal';
import TopicManagerEntry from './TopicManagerEntry';
import Settings from '@material-ui/icons/Settings';
import { toJS } from 'mobx';
import { resizeImage } from 'utils';

const TopView = observer(
  (props: {
    isMyself: boolean;
    topic: ITopic;
    subscribe: () => Promise<void>;
    unsubscribe: () => Promise<void>;
    openTopicManagerEntryModal: () => void;
    fetchTopic: any;
  }) => {
    const { userStore, modalStore } = useStore();
    const state = useLocalStore(() => ({
      showTopicContributionModal: false,
      showTopicIntroductionModal: false,
    }));
    const topic = props.topic;

    const Buttons = () => (
      <div className="flex items-start">
        <Button
          className="mr-5"
          onClick={() => {
            if (!userStore.isLogin) {
              modalStore.openLogin();
              return;
            }
            state.showTopicContributionModal = true;
          }}
          size={isMobile ? 'small' : 'normal'}
          color="green"
        >
          {props.isMyself ? '收录' : '投稿'}
        </Button>
        {topic.following ? (
          <Button
            outline
            color={isMobile ? 'white' : 'primary'}
            size={isMobile ? 'small' : 'normal'}
            onClick={props.unsubscribe}
          >
            已关注
          </Button>
        ) : (
          <Button onClick={props.subscribe} size={isMobile ? 'small' : 'normal'}>
            关注
          </Button>
        )}
      </div>
    );

    return (
      <div className="flex items-stretch overflow-hidden relative pb-4 md:rounded-12 bg-white">
        <div
          className="absolute top-0 left-0 w-full h-full overflow-hidden bg-cover bg-center cover md:rounded-12"
          style={{
            backgroundImage: `url('${resizeImage(topic.cover, 240)}')`,
          }}
        >
          <div className="absolute top-0 left-0 right-0 bottom-0 blur-layer md:rounded-12" />
        </div>
        <div className="z-10 w-full">
          <div className="flex justify-between w-full box-border pt-8 md:pt-24 md:mt-6 px-5 pb-3 md:pb-0 md:px-16 text-black">
            <div className="flex items-start md:items-end">
              <img
                className="rounded-12 avatar md:border-4 border-white bg-white"
                src={resizeImage(topic.cover, 240)}
                alt={topic.name}
              />
              <div className="ml-5">
                <div className="font-bold text-18 md:text-24 leading-none text-white md:text-gray-4a">
                  {topic.name}
                </div>
                <div className="mt-2 text-14 md:text-15 flex items-center text-white md:text-gray-9b pb-2">
                  <span>
                    <span className="text-14 md:text-15 font-bold">{topic.summary.post.count}</span>{' '}
                    篇文章
                  </span>
                  {topic.summary.follower.count > 0 && <span className="opacity-70 mx-2">·</span>}
                  {topic.summary.follower.count > 0 ? (
                    <span>
                      <span className="text-14 md:text-15 font-bold">
                        {topic.summary.follower.count}
                      </span>{' '}
                      人关注
                    </span>
                  ) : (
                    ''
                  )}
                </div>
                {isMobile && <div className="mt-1">{Buttons()}</div>}
              </div>
            </div>
            {isPc && (
              <div className="pt-2 mt-16 mr-3">
                {(topic.contributionEnabled || props.isMyself) && Buttons()}
              </div>
            )}
            {isMobile && props.isMyself && (
              <div
                className="settings-btn text-24 absolute top-0 right-0 mr-12 z-20 text-white opacity-75 flex items-center justify-center"
                onClick={() => props.openTopicManagerEntryModal()}
              >
                <Settings />
              </div>
            )}
          </div>
          {isMobile && (
            <div
              className="flex py-2 relative text-white text-opacity-75 text-13 px-5"
              onClick={() => {
                state.showTopicIntroductionModal = true;
              }}
            >
              <div className="truncate pr-1">{topic.description}</div>
              <div className="flex items-center text-13">
                <ArrowForwardIos />
              </div>
            </div>
          )}
        </div>
        <TopicContributionModal
          isMyself={props.isMyself}
          topicUuid={topic.uuid}
          open={state.showTopicContributionModal}
          close={() => {
            state.showTopicContributionModal = false;
            props.fetchTopic();
          }}
        />
        {isMobile && (
          <TopicIntroductionModal
            topic={props.topic}
            open={state.showTopicIntroductionModal}
            close={() => {
              state.showTopicIntroductionModal = false;
              props.fetchTopic();
            }}
          />
        )}
        <style jsx>{`
          .cover {
            height: ${isMobile ? 184 : 160}px;
          }
          .avatar {
            width: ${isMobile ? 90 : 120}px;
            height: ${isMobile ? 90 : 120}px;
          }
          .blur-layer {
            background: -webkit-linear-gradient(
              rgba(32, 32, 32, 0) 14%,
              rgba(32, 32, 32, 0.56) 100%
            );
            background: linear-gradient(rgba(32, 32, 32, 0) 14%, rgba(32, 32, 32, 0.56) 100%);
            -webkit-backdrop-filter: blur(20px);
            backdrop-filter: blur(20px);
          }
          .settings-btn {
            margin-top: 95px;
          }
        `}</style>
      </div>
    );
  },
);

export default observer((props: any) => {
  const state = useLocalStore(() => ({
    showTopicPostManagerModal: false,
    showTopicEditorModal: false,
    topic: {} as ITopic,
    isFetchedTopic: false,
    showTopicManagerEntryModal: false,
    showPosts: false,
  }));
  const { snackbarStore, userStore, preloadStore, confirmDialogStore, feedStore } = useStore();
  const loading = React.useMemo(() => !state.isFetchedTopic || !preloadStore.ready, [
    state.isFetchedTopic,
    preloadStore.ready,
  ]);
  const isMyself = React.useMemo(
    () => (state.topic.user && userStore.user.address === state.topic.user.address) || false,
    [state.topic.user, userStore.user.address],
  );
  const { uuid } = props.match.params;
  const tabs = [
    {
      type: 'POPULARITY',
      name: '热门',
    },
    {
      type: 'PUB_DATE',
      name: '最新收录',
    },
  ];

  const fetchTopic = React.useCallback(() => {
    (async () => {
      try {
        const topic = await topicApi.get(uuid);
        state.topic = topic;
        feedStore.setBelongedTopic(toJS(topic));
      } catch (err) {}
      state.isFetchedTopic = true;
    })();
  }, [state, feedStore, uuid]);

  const fetchTopicPosts = React.useCallback(() => {
    (async () => {
      feedStore.setIsFetching(true);
      try {
        const { total, posts } = await topicApi.fetchTopicPosts(uuid, {
          order: feedStore.filterType,
          offset: feedStore.page * feedStore.limit,
          limit: feedStore.limit,
        });
        feedStore.setTotal(total);
        feedStore.addPosts(posts);
      } catch (err) {
        console.log(err);
      }
      feedStore.setIsFetching(false);
      feedStore.setIsFetched(true);
    })();
  }, [feedStore, uuid]);

  React.useEffect(() => {
    if (feedStore.provider !== `topic:${uuid}`) {
      feedStore.setProvider(`topic:${uuid}`);
      feedStore.clear();
      feedStore.setFilterType(tabs[0].type);
      window.scrollTo(0, 0);
    }
  }, [feedStore, uuid, tabs]);

  React.useEffect(() => {
    if (state.isFetchedTopic) {
      (async () => {
        await sleep(500);
        state.showPosts = true;
      })();
    }
  }, [state.isFetchedTopic, state]);

  React.useEffect(() => {
    if (!feedStore.isNew && !feedStore.willLoadingPage) {
      if (feedStore.belongedTopic && feedStore.belongedTopic.uuid === uuid) {
        state.topic = feedStore.belongedTopic;
        state.isFetchedTopic = true;
        return;
      }
    }

    fetchTopic();
  }, [state, uuid, feedStore, fetchTopic]);

  React.useEffect(() => {
    if (!feedStore.filterType) {
      return;
    }
    if (feedStore.isFetching) {
      return;
    }
    if (!feedStore.isNew && !feedStore.willLoadingPage) {
      return;
    }

    fetchTopicPosts();
  }, [state, feedStore.page, feedStore.filterType, uuid, feedStore, fetchTopicPosts]);

  const infiniteRef: any = useWindowInfiniteScroll({
    loading: feedStore.isFetching,
    hasNextPage: feedStore.hasMorePosts,
    threshold: 350,
    onLoadMore: () => {
      feedStore.setPage(feedStore.page + 1);
    },
  });

  const handleFilterChange = (type: string) => {
    if (feedStore.isFetching) {
      return;
    }
    feedStore.setIsFetched(false);
    feedStore.setPage(0);
    feedStore.filterType = type as FilterType;
  };

  const subscribe = async () => {
    try {
      await topicApi.subscribe(state.topic.uuid);
      state.topic.following = true;
      state.topic.summary!.follower!.count += 1;
    } catch (err) {
      console.log(err);
    }
  };

  const unsubscribe = async () => {
    try {
      await topicApi.unsubscribe(state.topic.uuid);
      state.topic.following = false;
      state.topic.summary!.follower!.count -= 1;
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30">
          <Loading />
        </div>
      </div>
    );
  }

  if (state.isFetchedTopic && _.isEmpty(state.topic)) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30 text-base md:text-xl text-center text-gray-600">
          抱歉，你访问的专题不存在
        </div>
      </div>
    );
  }

  const onDelete = () => {
    confirmDialogStore.show({
      content: `专题删除后将无法找回，确定要删除吗？`,
      okText: '确定',
      contentClassName: 'text-left',
      ok: async () => {
        confirmDialogStore.setLoading(true);
        try {
          await topicApi.delete(state.topic.uuid);
          snackbarStore.show({
            message: '专题已删除，即将返回你的个人首页',
            duration: 2000,
          });
          await sleep(2000);
          confirmDialogStore.hide();
          props.history.push(`/authors/${userStore.user.address}`);
        } catch (err) {
          confirmDialogStore.setLoading(false);
        }
      },
    });
  };

  return (
    <Fade in={true} timeout={isMobile ? 0 : 500}>
      <div className="w-full md:w-916 md:m-auto -mt-2 md:mt-0">
        <TopView
          isMyself={isMyself}
          topic={state.topic}
          subscribe={subscribe}
          unsubscribe={unsubscribe}
          openTopicManagerEntryModal={() => (state.showTopicManagerEntryModal = true)}
          fetchTopic={() => {
            fetchTopic();
            feedStore.setIsFetched(false);
            feedStore.setPage(0);
            feedStore.clear();
            feedStore.setFilterType(tabs[1].type);
            fetchTopicPosts();
          }}
        />
        <div className="mt-3 md:pb-10 flex justify-between items-start">
          <div className="w-full md:w-8/12 box-border md:pr-3">
            <div className="bg-white md:px-5 pb-8 md:rounded-12 h-screen md:h-auto">
              <Filter
                provider="topic"
                onChange={handleFilterChange}
                type={feedStore.filterType}
                tabs={tabs}
              />
              {feedStore.filterType !== 'OTHERS' && (
                <div className="posts-container" ref={infiniteRef}>
                  <div className="mt-2" />
                  {feedStore.isFetched && state.showPosts && feedStore.hasPosts && (
                    <Posts posts={feedStore.posts} hideTopics smallCoverSize />
                  )}
                  {feedStore.isFetched && state.showPosts && !feedStore.hasPosts && (
                    <div className="pt-20 pb-16 text-center text-gray-500">还没有收录文章</div>
                  )}
                  {(!feedStore.isFetched || !state.showPosts) && (
                    <div className="pt-20 md:pt-20">
                      <Loading />
                    </div>
                  )}
                  {feedStore.isFetched && state.showPosts && feedStore.hasMorePosts && (
                    <div className="mt-10">
                      <Loading />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {isPc && (
            <div className="w-4/12">
              <div className="bg-white rounded-12 pb-2 mb-3 text-gray-4a">
                <div className="px-5 py-4 leading-none text-16 border-b border-gray-d8 border-opacity-75 flex justify-between items-center">
                  专题介绍
                </div>
                <div
                  className="px-5 py-4 markdown-body small"
                  dangerouslySetInnerHTML={{ __html: marked.parse(state.topic.description) }}
                ></div>
              </div>

              <div className="bg-white rounded-12 pb-2 mb-3 text-gray-4a">
                <div className="px-5 py-4 leading-none text-16 border-b border-gray-d8 border-opacity-75 flex justify-between items-center">
                  创建人
                </div>
                <div className="px-5 py-4">
                  <Link to={`/authors/${state.topic.user?.address}`}>
                    <div className="flex items-center cursor-pointer">
                      <img
                        className="w-8 h-8 rounded-full"
                        src={resizeImage(state.topic.user?.avatar)}
                        alt={state.topic.user?.nickname}
                      />
                      <span className="ml-3">{state.topic.user?.nickname}</span>
                    </div>
                  </Link>
                </div>
              </div>

              <FolderGrid
                folders={[
                  {
                    hide: state.topic.summary?.author?.count === 0,
                    topicUuid: state.topic.uuid,
                    type: 'TOPIC_AUTHORS',
                    title: '包含的作者',
                    content: `${state.topic.summary?.author?.count}个`,
                    gallery: state.topic.summary?.author?.preview || [],
                  },
                  {
                    hide: state.topic.summary.follower.count === 0,
                    topicUuid: state.topic.uuid,
                    type: 'TOPIC_FOLLOWERS',
                    title: '关注的人',
                    content: `${state.topic.summary.follower.count}个`,
                    gallery: state.topic.summary.follower.preview,
                  },
                ]}
              />

              {isMyself && (
                <div className="bg-white rounded-12 pb-2 mb-3 text-gray-4a">
                  <div className="px-5 py-4 leading-none text-16 border-b border-gray-d8 border-opacity-75 flex justify-between items-center">
                    专题管理
                  </div>
                  <div className="px-5 py-4">
                    <div className="text-13 flex items-center">
                      <div>
                        <span
                          className="text-blue-400 cursor-pointer"
                          onClick={() => (state.showTopicEditorModal = true)}
                        >
                          编辑
                        </span>
                      </div>
                      <span className="opacity-50 mx-2">·</span>
                      <span className="text-blue-400 cursor-pointer" onClick={onDelete}>
                        删除
                      </span>
                      {feedStore.posts.length > 0 && <span className="opacity-50 mx-2">·</span>}
                      {feedStore.posts.length > 0 && (
                        <div>
                          <span
                            className="text-blue-400 cursor-pointer"
                            onClick={() => (state.showTopicPostManagerModal = true)}
                          >
                            移除文章
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {isMyself && (
            <div>
              <TopicEditorModal
                open={state.showTopicEditorModal}
                close={() => (state.showTopicEditorModal = false)}
                topic={state.topic}
                onChange={async (topic) => {
                  if (topic) {
                    fetchTopic();
                    await sleep(400);
                    snackbarStore.show({
                      message: '专题已更新',
                    });
                  }
                }}
              />
              <TopicPostManagerModal
                topicUuid={state.topic.uuid}
                open={state.showTopicPostManagerModal}
                close={() => {
                  state.showTopicPostManagerModal = false;
                  fetchTopic();
                }}
              />
              {isMobile && (
                <TopicManagerEntry
                  topic={props.topic}
                  open={state.showTopicManagerEntryModal}
                  close={() => {
                    state.showTopicManagerEntryModal = false;
                    fetchTopic();
                  }}
                  onEdit={() => (state.showTopicEditorModal = true)}
                  onDelete={onDelete}
                  onRemove={() => (state.showTopicPostManagerModal = true)}
                />
              )}
            </div>
          )}
          <style jsx>{`
            .posts-container {
              min-height: 90vh;
            }
          `}</style>
        </div>
      </div>
    </Fade>
  );
});
