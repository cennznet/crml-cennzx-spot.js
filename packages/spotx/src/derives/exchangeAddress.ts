import {ApiInterface$Rx} from '@cennznet/api/polkadot.types';
import {AnyAssetId} from '@cennznet/generic-asset/dist/types';
import {Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {generateExchangeAddress} from '../utils/utils';
import {getSpotXQuery} from './index';

export function exchangeAddress(api: ApiInterface$Rx) {
    return (assetId: AnyAssetId): Observable<string> => {
        const spotXQuery = getSpotXQuery(api);
        return spotXQuery.coreAssetId().pipe(
            map(coreAssetId => generateExchangeAddress(coreAssetId as any, assetId)),
            first()
        );
    };
}
