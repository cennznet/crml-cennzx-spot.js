import {ApiInterface$Rx} from '@cennznet/api/polkadot.types';
import {AnyAssetId} from '@cennznet/generic-asset/dist/types';
import {Hash, Permill, u128} from '@cennznet/types/polkadot';
import {AnyNumber, Codec} from '@cennznet/types/polkadot.types';
import BN from 'bn.js';
import {combineLatest, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {getOutputPrice} from '../utils/utils';
import {exchangeAddress} from './exchangeAddress';

export function getSpotXQuery(api): any {
    try {
        api.query.cennzxSpot.defaultFeeRate();
        return api.query.cennzxSpot;
    } catch (e) {
        api.query.cennzX.defaultFeeRate();
        return api.query.cennzX;
    }
}

export function assetToCoreOutputPrice(api: ApiInterface$Rx) {
    const spotXQuery = getSpotXQuery(api);
    const coreAssetId: Codec = spotXQuery.coreAssetId();
    return (assetId: AnyAssetId, amountBought: AnyNumber): Observable<BN> =>
        combineLatest(coreAssetId, exchangeAddress(api)(assetId), spotXQuery.defaultFeeRate()).pipe(
            switchMap(([coreAssetId, exchangeAddress, feeRate]) =>
                combineLatest(
                    api.derive.genericAsset.freeBalance(assetId, exchangeAddress),
                    api.derive.genericAsset.freeBalance(coreAssetId, exchangeAddress)
                ).pipe(map(([tradeAssetReserve, coreAssetReserve]) => [tradeAssetReserve, coreAssetReserve, feeRate]))
            ),
            map(([tradeAssetReserve, coreAssetReserve, feeRate]) =>
                getOutputPrice(
                    new u128(amountBought),
                    tradeAssetReserve as any,
                    coreAssetReserve as any,
                    (feeRate as unknown) as Permill
                )
            )
        );
}

export function assetToCoreOutputPriceAt(api: ApiInterface$Rx) {
    const spotXQuery = getSpotXQuery(api);
    return (hash: Hash, assetId: AnyAssetId, amountBought: AnyNumber): Observable<BN> => {
        const coreAssetId: Codec = spotXQuery.coreAssetId.at(hash);
        return combineLatest(coreAssetId, exchangeAddress(api)(assetId), spotXQuery.defaultFeeRate.at(hash)).pipe(
            switchMap(([coreAssetId, exchangeAddress, feeRate]) =>
                combineLatest(
                    api.derive.genericAsset.freeBalanceAt(hash, assetId, exchangeAddress),
                    api.derive.genericAsset.freeBalanceAt(hash, coreAssetId, exchangeAddress)
                ).pipe(map(([tradeAssetReserve, coreAssetReserve]) => [tradeAssetReserve, coreAssetReserve, feeRate]))
            ),
            map(([tradeAssetReserve, coreAssetReserve, feeRate]) =>
                getOutputPrice(
                    new u128(amountBought),
                    tradeAssetReserve as any,
                    coreAssetReserve as any,
                    (feeRate as unknown) as Permill
                )
            )
        );
    };
}
