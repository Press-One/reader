import React from 'react';
import { observer } from 'mobx-react-lite';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import Viewer from 'react-viewer';
import marked from 'marked';
import WaitingForFeed from 'components/WaitingForFeed';
import BackButton from 'components/BackButton';
import Button from 'components/Button';
import RewardModal from './rewardModal';
import { useStore } from 'store';
import { ago, isMobile } from 'utils';

import 'react-viewer/dist/index.css';
import './index.scss';

export default observer((props: any) => {
  const { feedStore } = useStore();
  const [showImage, setShowImage] = React.useState(false);
  const [imgSrc, setImgSrc] = React.useState('');
  const [openRewardModal, setOpenRewardModal] = React.useState(false);

  React.useEffect(() => {
    if (feedStore.currentPost) {
      const { title } = feedStore.currentPost;
      document.title = `${title} - 飞贴`;
    }
  });

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const bindClickEvent = (e: any) => {
      if (e.target.tagName === 'A') {
        const href = e.target.getAttribute('href');
        window.open(href);
        e.preventDefault();
      } else if (e.target.tagName === 'IMG') {
        setImgSrc(e.target.src);
        setShowImage(true);
      }
    };

    setTimeout(() => {
      const markdownBody = document.querySelector('.markdown-body');
      if (markdownBody) {
        markdownBody.addEventListener('click', bindClickEvent);
      }
    }, 2000);

    return () => {
      const markdownBody = document.querySelector('.markdown-body');
      if (markdownBody) {
        markdownBody.addEventListener('click', bindClickEvent);
      }
    };
  }, []);

  if (!feedStore.isFetched) {
    return null;
  }

  const backToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (e) {
      window.scroll(0, 0);
    }
  };

  const reward = () => {
    setOpenRewardModal(true);
  };

  const { postId } = props.match.params;
  feedStore.setPostId(decodeURIComponent(postId));
  const { currentPost: post } = feedStore;

  if (!post) {
    return <WaitingForFeed />;
  }

  return (
    <div className="w-7/12 m-auto post po-fade-in relative">
      {!isMobile && <BackButton />}
      <h2 className={`po-text-${isMobile ? '24' : '26'} dark-color push-none title po-height-15`}>
        {post.title}
      </h2>
      <div className={`push-top-sm gray-color po-text-${isMobile ? '14' : '16'}`}>
        {post.author} | {ago(post.pubDate)}
      </div>
      <div
        className={`push-top-lg po-text-16 black-color markdown-body pad-bottom-md`}
        dangerouslySetInnerHTML={{ __html: marked.parse(post.content) }}
      />
      {!isMobile && post.content.length > 1500 && (
        <div className="back-top-btn flex v-center gray-color po-cp po-text-22" onClick={backToTop}>
          <ArrowUpward />
        </div>
      )}
      <div className="text-center pb-10" onClick={reward}>
        <Button>打赏</Button>
      </div>
      <RewardModal open={openRewardModal} onClose={() => setOpenRewardModal(false)} />
      <Viewer
        onMaskClick={() => setShowImage(false)}
        noNavbar={true}
        noToolbar={true}
        visible={showImage}
        onClose={() => setShowImage(false)}
        images={[{ src: imgSrc }]}
      />
    </div>
  );
});
