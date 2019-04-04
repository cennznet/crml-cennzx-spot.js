import {ApiInterface$Rx} from '@cennznet/api/polkadot.types';
import {AnyAssetId} from '@cennznet/generic-asset/dist/types';
import {Address, Balance, Data, getTypeRegistry, Hash, Option, Vector} from '@cennznet/types/polkadot';
import {generateStorageDoubleMapKey} from '@cennznet/util';
import {drr} from '@polkadot/api-derive/util/drr';
import BN from 'bn.js';
import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {AnyAddress} from '../types';
import {getExchangeKey} from '../utils/utils';
import {getSpotXQuery} from './assetToCoreOutputPrice';
import {QueryableStorage} from '@cennznet/api/polkadot.types';
import {Codec} from '@cennznet/types/polkadot.types';

const PREFIX = 'cennz-x-spot:liquidity';

export function liquidityBalance(api: ApiInterface$Rx) {
    const spotXQuery = getSpotXQuery(api);
    return (assetId: AnyAssetId, address: AnyAddress): Observable<BN> =>
        spotXQuery.coreAssetId().pipe(
            map(coreAssetId =>
                generateStorageDoubleMapKey(PREFIX, getExchangeKey(coreAssetId as any, assetId), new Address(address))
            ),
            switchMap(key => api.rpc.state.subscribeStorage([key as Codec])),
            map(([data]: Vector<Option<Data>>) => new Balance(data.unwrapOr(undefined))),
            drr()
        );
}

export function liquidityBalanceAt(api: ApiInterface$Rx) {
    const spotXQuery = getSpotXQuery(api);
    return (hash: Hash, assetId: AnyAssetId, address: AnyAddress): Observable<BN> =>
        spotXQuery.coreAssetId.at(hash).pipe(
            map(coreAssetId =>
                generateStorageDoubleMapKey(PREFIX, getExchangeKey(coreAssetId as any, assetId), new Address(address))
            ),
            switchMap(key => api.rpc.state.getStorage(key as Codec, hash)),
            map(([data]: Vector<Option<Data>>) => new Balance(data.unwrapOr(undefined))),
            drr()
        );
}
