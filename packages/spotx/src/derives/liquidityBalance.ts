import {ApiInterface$Rx} from '@cennznet/api/polkadot.types';
import {AnyAssetId} from '@cennznet/crml-generic-asset/types';
import {Address, Balance, Data, Hash, Option, Vector} from '@cennznet/types/polkadot';
import {generateStorageDoubleMapKey} from '@cennznet/util';
import {drr} from '@polkadot/api-derive/util/drr';
import BN from 'bn.js';
import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {AnyAddress} from '../types';
import {getExchangeKey} from '../utils/utils';

const PREFIX = 'cennz-x-spot:liquidity';

export function liquidityBalance(api: ApiInterface$Rx) {
    return (assetId: AnyAssetId, address: AnyAddress): Observable<BN> => {
        return api.query.cennzxSpot.coreAssetId().pipe(
            map(coreAssetId =>
                generateStorageDoubleMapKey(PREFIX, getExchangeKey(coreAssetId as any, assetId), new Address(address))
            ),
            switchMap(key => api.rpc.state.subscribeStorage([key])),
            map(([data]: Vector<Option<Data>>) => new Balance(data.unwrapOr(undefined))),
            drr()
        );
    };
}

export function liquidityBalanceAt(api: ApiInterface$Rx) {
    return (hash: Hash, assetId: AnyAssetId, address: AnyAddress): Observable<BN> => {
        return api.query.cennzxSpot.coreAssetId.at(hash).pipe(
            map(coreAssetId =>
                generateStorageDoubleMapKey(PREFIX, getExchangeKey(coreAssetId as any, assetId), new Address(address))
            ),
            switchMap(key => api.rpc.state.getStorage(key, hash)),
            map(([data]: Vector<Option<Data>>) => new Balance(data.unwrapOr(undefined))),
            drr()
        );
    };
}
