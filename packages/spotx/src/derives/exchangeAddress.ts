import {ApiInterface$Rx} from '@cennznet/api/polkadot.types';
import {AnyAssetId} from '@cennznet/generic-asset/dist/types';
import {Observable} from 'rxjs';
import {map, first} from 'rxjs/operators';
import {generateExchangeAddress} from '../utils/utils';

export function exchangeAddress(api: ApiInterface$Rx) {
    return (assetId: AnyAssetId): Observable<string> =>
        api.query.cennzX.coreAssetId().pipe(
            map(coreAssetId => generateExchangeAddress(coreAssetId as any, assetId)),
            first()
        );
}
