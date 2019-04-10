import {ApiInterface$Rx, QueryableStorageFunction} from '@cennznet/api/polkadot.types';
import {AnyAssetId} from '@cennznet/generic-asset/dist/types';
import {Hash} from '@cennznet/types/polkadot';
import BN from 'bn.js';
import {Observable} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {getExchangeKey} from '../utils/utils';
import {getSpotXQuery} from './index';

export function totalLiquidity(api: ApiInterface$Rx) {
    return (assetId: AnyAssetId): Observable<BN> => {
        const spotXQuery = getSpotXQuery(api);
        return spotXQuery.coreAssetId().pipe(
            switchMap(coreAssetId => {
                const exchangeKey = getExchangeKey((coreAssetId as unknown) as BN, assetId);
                return (spotXQuery.totalSupply(exchangeKey) as unknown) as QueryableStorageFunction<Observable<BN>, {}>;
            })
        );
    };
}

export function totalLiquidityAt(api: ApiInterface$Rx) {
    return (hash: Hash, assetId: AnyAssetId): Observable<BN> => {
        const spotXQuery = getSpotXQuery(api);
        return spotXQuery.coreAssetId.at(hash).pipe(
            switchMap(coreAssetId => {
                const exchangeKey = getExchangeKey((coreAssetId as unknown) as BN, assetId);
                return (spotXQuery.totalSupply.at(hash, exchangeKey) as unknown) as QueryableStorageFunction<
                    Observable<BN>,
                    {}
                >;
            })
        );
    };
}
