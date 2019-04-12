import {ApiInterface$Rx} from '@cennznet/api/polkadot.types';
import {AnyAssetId} from '@cennznet/crml-generic-asset/types';
import {Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {generateExchangeAddress} from '../utils/utils';

export function exchangeAddress(api: ApiInterface$Rx) {
    return (assetId: AnyAssetId): Observable<string> => {
        return api.query.cennzxSpot.coreAssetId().pipe(
            map(coreAssetId => generateExchangeAddress(coreAssetId as any, assetId)),
            first()
        );
    };
}
