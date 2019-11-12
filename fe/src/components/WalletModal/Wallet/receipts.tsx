import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import Fade from '@material-ui/core/Fade';
import Loading from 'components/Loading';
import { assetIconMap, getPostsSiteDomain } from './utils';
import FinanceApi from './api';
import { sleep } from 'utils';
import { useStore } from 'store';

const getTypeName = (type: string) => {
  const map: any = {
    RECHARGE: '充值',
    WITHDRAW: '提现',
    REWARD: '打赏文章',
  };
  return map[type];
};

const Receipt = (receipt: any, postMap: any = {}, mixinWalletClientId: string) => {
  return (
    <div className="border-b border-gray-300 flex justify-between items-center py-3 px-2 leading-none">
      <div className="flex items-center text-gray-700 text-sm">
        <img
          className="mr-4"
          src={assetIconMap[receipt.currency]}
          alt={receipt.currency}
          width="40"
          height="40"
        />
        {getTypeName(receipt.type)}
        {receipt.type === 'REWARD' && (
          <a
            href={`${getPostsSiteDomain()}/posts/${receipt.objectRId}`}
            className="text-blue-400 ml-2 truncate w-64"
            target="_blank"
            rel="noopener noreferrer"
            title={(postMap[receipt.objectRId] || {}).title}
          >
            {(postMap[receipt.objectRId] || {}).title}
          </a>
        )}
      </div>
      <div className="flex items-center">
        <span
          className={classNames(
            {
              'text-green-400': mixinWalletClientId === receipt.toProviderUserId,
              'text-red-400': mixinWalletClientId === receipt.fromProviderUserId,
            },
            'font-bold text-lg mr-1',
          )}
        >
          {mixinWalletClientId === receipt.toProviderUserId && '+'}
          {mixinWalletClientId === receipt.fromProviderUserId && '-'}
          {parseFloat(receipt.amount)}
        </span>
        <span className="text-xs font-bold">{receipt.currency}</span>
      </div>
    </div>
  );
};

export default observer(() => {
  const { userStore, walletStore, feedStore } = useStore();
  const { mixinWalletClientId } = userStore.user;
  const { isFetchedReceipts, receipts } = walletStore;

  React.useEffect(() => {
    (async () => {
      try {
        const receipts = await FinanceApi.getReceipts({
          limit: 100,
        });
        await sleep(800);
        walletStore.setReceipts(receipts);
        walletStore.setIsFetchedReceipts(true);
      } catch (err) {}
    })();
  }, [walletStore]);

  if (!isFetchedReceipts) {
    return (
      <div className="mt-32">
        <Loading />
      </div>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <div>
        {receipts.map((receipt: any) => (
          <div key={receipt.id}>{Receipt(receipt, feedStore.postMap, mixinWalletClientId)}</div>
        ))}
        {receipts.length === 0 && (
          <div className="text-gray-500 mt-32 text-center text-sm">暂时没有交易记录</div>
        )}
      </div>
    </Fade>
  );
});