import React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import Fade from '@material-ui/core/Fade';
import Loading from 'components/Loading';
import BackButton from 'components/BackButton';

const author = (address: string, authorMap: any) => {
  const profile = authorMap[address];
  return (
    <Link to={`/authors/${address}`}>
      <div className="flex items-center border-t border-gray-300 py-2 px-4 cursor-pointer">
        <img className="w-10 h-10 rounded-full" src={profile.avatar} alt={profile.name} />
        <div className="ml-3 author-name text-gray-700 truncate w-4/5">{profile.name}</div>
      </div>
    </Link>
  );
};

export default observer((props: any) => {
  const { feedStore, subscriptionStore } = useStore();
  const { authorMap } = feedStore;
  const { authors } = subscriptionStore;
  const isFetched = subscriptionStore.isFetched && feedStore.isFetched;

  if (!isFetched) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30">
          <Loading />
        </div>
      </div>
    );
  }

  const hasAuthors = authors.length > 0;

  return (
    <Fade in={true} timeout={500}>
      <div className="md:w-7/12 m-auto pb-10 relative">
        <div className="hidden md:block">
          <BackButton history={props.history} />
        </div>
        <div className="text-center px-4 font-bold text-xl text-gray-700">我的关注</div>
        {hasAuthors && (
          <div className="mt-3 md:mt-8 md:w-6/12 md:m-auto border-b border-gray-300 md:border-gray-200">
            {authors.map((address: any) => {
              return (
                <div key={address} className="author">
                  {author(address, authorMap)}
                </div>
              );
            })}
          </div>
        )}
        {!hasAuthors && (
          <div className="mt-5">
            <div className="md:w-6/12 md:m-auto pt-10 text-center text-gray-500 md:border-t md:border-gray-200">
              去关注你感兴趣的作者吧！
            </div>
          </div>
        )}
        <style jsx>{`
          .author-name {
            font-size: 15px;
          }
          .author:hover {
            background: rgba(0, 0, 0, 0.01);
          }
        `}</style>
      </div>
    </Fade>
  );
});