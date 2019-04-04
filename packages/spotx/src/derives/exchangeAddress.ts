import {ApiInterface$Rx} from '@cennznet/api/polkadot.types';
import {AnyAssetId} from '@cennznet/generic-asset/dist/types';
import {Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {generateExchangeAddress} from '../utils/utils';
import {getSpotXQuery} from './assetToCoreOutputPrice';

export function exchangeAddress(api: ApiInterface$Rx) {
    const spotXQuery = getSpotXQuery(api);
    return (assetId: AnyAssetId): Observable<string> =>
        spotXQuery.coreAssetId().pipe(
            map(coreAssetId => generateExchangeAddress(coreAssetId as any, assetId)),
            first()
        );
}
