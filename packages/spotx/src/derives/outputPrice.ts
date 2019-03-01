// Copyright 2019 Centrality Investments Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import {ApiInterface$Rx} from '@cennznet/api/polkadot.types';
import EnhancedAssetId from '@cennznet/crml-generic-asset/registry/EnhancedAssetId';
import {AnyAssetId} from '@cennznet/crml-generic-asset/types';
import {Hash, Permill, u128} from '@cennznet/types/polkadot';
import {AnyNumber} from '@cennznet/types/polkadot.types';
import BN from 'bn.js';
import {combineLatest, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {getOutputPrice} from '../utils/utils';
import {exchangeAddress} from './exchangeAddress';

export function outputPrice(api: ApiInterface$Rx) {
    return (assetA: AnyAssetId, assetB: AnyAssetId, amountBought: AnyNumber): Observable<BN> => {
        return api.query.cennzxSpot.coreAssetId().pipe(
            switchMap((coreAssetId: EnhancedAssetId) => {
                if (new EnhancedAssetId(assetA).eq(coreAssetId)) {
                    return coreToAssetOutputPrice(assetB, assetA, amountBought, api);
                } else if (new EnhancedAssetId(assetB).eq(coreAssetId)) {
                    return assetToCoreOutputPrice(assetA, assetB, amountBought, api);
                } else {
                    return assetToAssetOutputPrice(assetA, assetB, coreAssetId, amountBought, api);
                }
            })
        );
    };
}

export function outputPriceAt(api: ApiInterface$Rx) {
    return (hash: Hash, assetA: AnyAssetId, assetB: AnyAssetId, amountBought: AnyNumber): Observable<BN> => {
        return api.query.cennzxSpot.coreAssetId.at(hash).pipe(
            switchMap((coreAssetId: EnhancedAssetId) => {
                if (new EnhancedAssetId(assetA).eq(coreAssetId)) {
                    return coreToAssetOutputPriceAt(hash, assetB, assetA, amountBought, api);
                } else if (new EnhancedAssetId(assetB).eq(coreAssetId)) {
                    return assetToCoreOutputPriceAt(hash, assetA, assetB, amountBought, api);
                } else {
                    return assetToAssetOutputPriceAt(hash, assetA, assetB, coreAssetId, amountBought, api);
                }
            })
        );
    };
}

function assetToCoreOutputPrice(
    assetId: AnyAssetId,
    coreAssetId: AnyAssetId,
    amountBought: AnyNumber,
    api: ApiInterface$Rx
) {
    const defaultFeeRate = api.query.cennzxSpot.defaultFeeRate();
    return combineLatest(exchangeAddress(api)(assetId), defaultFeeRate).pipe(
        switchMap(([exchangeAddress, feeRate]) =>
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

function assetToCoreOutputPriceAt(
    hash: Hash,
    assetId: AnyAssetId,
    coreAssetId: AnyAssetId,
    amountBought: AnyNumber,
    api: ApiInterface$Rx
) {
    const defaultFeeRate = api.query.cennzxSpot.defaultFeeRate.at(hash);
    return combineLatest(exchangeAddress(api)(assetId), defaultFeeRate).pipe(
        switchMap(([exchangeAddress, feeRate]) =>
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
}

function coreToAssetOutputPrice(
    assetId: AnyAssetId,
    coreAssetId: AnyAssetId,
    amountBought: AnyNumber,
    api: ApiInterface$Rx
) {
    const defaultFeeRate = api.query.cennzxSpot.defaultFeeRate();
    return combineLatest(exchangeAddress(api)(assetId), defaultFeeRate).pipe(
        switchMap(([exchangeAddress, feeRate]) =>
            combineLatest(
                api.derive.genericAsset.freeBalance(assetId, exchangeAddress),
                api.derive.genericAsset.freeBalance(coreAssetId, exchangeAddress)
            ).pipe(map(([tradeAssetReserve, coreAssetReserve]) => [tradeAssetReserve, coreAssetReserve, feeRate]))
        ),
        map(([tradeAssetReserve, coreAssetReserve, feeRate]) => {
            const price = getOutputPrice(
                new u128(amountBought),
                coreAssetReserve as any,
                tradeAssetReserve as any,
                (feeRate as unknown) as Permill
            );
            return price;
        })
    );
}

function coreToAssetOutputPriceAt(
    hash: Hash,
    assetId: AnyAssetId,
    coreAssetId: AnyAssetId,
    amountBought: AnyNumber,
    api: ApiInterface$Rx
) {
    const defaultFeeRate = api.query.cennzxSpot.defaultFeeRate.at(hash);
    return combineLatest(exchangeAddress(api)(assetId), defaultFeeRate).pipe(
        switchMap(([exchangeAddress, feeRate]) =>
            combineLatest(
                api.derive.genericAsset.freeBalanceAt(hash, assetId, exchangeAddress),
                api.derive.genericAsset.freeBalanceAt(hash, coreAssetId, exchangeAddress)
            ).pipe(map(([tradeAssetReserve, coreAssetReserve]) => [tradeAssetReserve, coreAssetReserve, feeRate]))
        ),
        map(([tradeAssetReserve, coreAssetReserve, feeRate]) =>
            getOutputPrice(
                new u128(amountBought),
                coreAssetReserve as any,
                tradeAssetReserve as any,
                (feeRate as unknown) as Permill
            )
        )
    );
}

function assetToAssetOutputPrice(
    assetA: AnyAssetId,
    assetB: AnyAssetId,
    coreAssetId: EnhancedAssetId,
    amountBought: AnyNumber,
    api: ApiInterface$Rx
) {
    const defaultFeeRate = api.query.cennzxSpot.defaultFeeRate();
    return combineLatest(exchangeAddress(api)(assetA), exchangeAddress(api)(assetB), defaultFeeRate).pipe(
        switchMap(([exchangeAddressForA, exchangeAddressForB, feeRate]) =>
            combineLatest(
                api.derive.genericAsset.freeBalance(assetA, exchangeAddressForA),
                api.derive.genericAsset.freeBalance(coreAssetId, exchangeAddressForA),
                api.derive.genericAsset.freeBalance(assetB, exchangeAddressForB),
                api.derive.genericAsset.freeBalance(coreAssetId, exchangeAddressForB)
            ).pipe(
                map(([tradeAssetReserveA, coreAssetReserveA, tradeAssetReserveB, coreAssetReserveB]) => [
                    tradeAssetReserveA,
                    coreAssetReserveA,
                    tradeAssetReserveB,
                    coreAssetReserveB,
                    feeRate,
                ])
            )
        ),
        map(([tradeAssetReserveA, coreAssetReserveA, tradeAssetReserveB, coreAssetReserveB, feeRate]) => {
            const coreForB = getOutputPrice(
                new u128(amountBought),
                tradeAssetReserveB as any,
                coreAssetReserveB as any,
                (feeRate as unknown) as Permill
            );
            return getOutputPrice(
                new u128(coreForB),
                coreAssetReserveA as any,
                tradeAssetReserveA as any,
                (feeRate as unknown) as Permill
            );
        })
    );
}

function assetToAssetOutputPriceAt(
    hash: Hash,
    assetA: AnyAssetId,
    assetB: AnyAssetId,
    coreAssetId: EnhancedAssetId,
    amountBought: AnyNumber,
    api: ApiInterface$Rx
) {
    const defaultFeeRate = api.query.cennzxSpot.defaultFeeRate.at(hash);
    return combineLatest(exchangeAddress(api)(assetA), exchangeAddress(api)(assetB), defaultFeeRate).pipe(
        switchMap(([exchangeAddressForA, exchangeAddressForB, feeRate]) =>
            combineLatest(
                api.derive.genericAsset.freeBalanceAt(hash, assetA, exchangeAddressForA),
                api.derive.genericAsset.freeBalanceAt(hash, coreAssetId, exchangeAddressForA),
                api.derive.genericAsset.freeBalanceAt(hash, assetB, exchangeAddressForB),
                api.derive.genericAsset.freeBalanceAt(hash, coreAssetId, exchangeAddressForB)
            ).pipe(
                map(([tradeAssetReserveA, coreAssetReserveA, tradeAssetReserveB, coreAssetReserveB]) => [
                    tradeAssetReserveA,
                    coreAssetReserveA,
                    tradeAssetReserveB,
                    coreAssetReserveB,
                    feeRate,
                ])
            )
        ),
        map(([tradeAssetReserveA, coreAssetReserveA, tradeAssetReserveB, coreAssetReserveB, feeRate]) => {
            const coreForB = getOutputPrice(
                new u128(amountBought),
                tradeAssetReserveB as any,
                coreAssetReserveB as any,
                (feeRate as unknown) as Permill
            );
            return getOutputPrice(
                new u128(coreForB),
                coreAssetReserveA as any,
                tradeAssetReserveA as any,
                (feeRate as unknown) as Permill
            );
        })
    );
}
