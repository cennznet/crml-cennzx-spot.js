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
import {drr} from '@plugnet/api-derive/util/drr';
import BN from 'bn.js';
import {combineLatest, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {getInputPrice} from '../utils/utils';
import {exchangeAddress} from './exchangeAddress';

export function inputPrice(api: ApiInterface$Rx) {
    return (assetA: AnyAssetId, assetB: AnyAssetId, sellAmount: AnyNumber): Observable<BN> => {
        return api.query.cennzxSpot.coreAssetId().pipe(
            switchMap((coreAssetId: EnhancedAssetId) => {
                if (new EnhancedAssetId(assetA).eq(coreAssetId)) {
                    return coreToAssetInputPrice(assetB, assetA, sellAmount, api);
                } else if (new EnhancedAssetId(assetB).eq(coreAssetId)) {
                    return assetToCoreInputPrice(assetA, assetB, sellAmount, api);
                } else {
                    return assetToAssetInputPrice(assetA, assetB, coreAssetId, sellAmount, api);
                }
            }),
            drr()
        );
    };
}

export function inputPriceAt(api: ApiInterface$Rx) {
    return (hash: Hash, assetA: AnyAssetId, assetB: AnyAssetId, sellAmount: AnyNumber): Observable<BN> => {
        return api.query.cennzxSpot.coreAssetId.at(hash).pipe(
            switchMap((coreAssetId: EnhancedAssetId) => {
                if (new EnhancedAssetId(assetA).eq(coreAssetId)) {
                    return coreToAssetInputPriceAt(hash, assetB, assetA, sellAmount, api);
                } else if (new EnhancedAssetId(assetB).eq(coreAssetId)) {
                    return assetToCoreInputPriceAt(hash, assetA, assetB, sellAmount, api);
                } else {
                    return assetToAssetInputPriceAt(hash, assetA, assetB, coreAssetId, sellAmount, api);
                }
            })
        );
    };
}

// Returns amount of core that can be bought with input assets.
function assetToCoreInputPrice(
    assetId: AnyAssetId,
    coreAssetId: AnyAssetId,
    sellAmount: AnyNumber,
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
            getInputPrice(
                new u128(sellAmount),
                tradeAssetReserve as any,
                coreAssetReserve as any,
                (feeRate as unknown) as Permill
            )
        )
    );
}

/// Returns amount of core that can be bought with input assets.
function assetToCoreInputPriceAt(
    hash: Hash,
    assetId: AnyAssetId,
    coreAssetId: AnyAssetId,
    sellAmount: AnyNumber,
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
            getInputPrice(
                new u128(sellAmount),
                tradeAssetReserve as any,
                coreAssetReserve as any,
                (feeRate as unknown) as Permill
            )
        )
    );
}

// Returns the amount of trade asset to pay for `sellAmount` of core sold.
function coreToAssetInputPrice(
    assetId: AnyAssetId,
    coreAssetId: AnyAssetId,
    sellAmount: AnyNumber,
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
            const price = getInputPrice(
                new u128(sellAmount),
                coreAssetReserve as any,
                tradeAssetReserve as any,
                (feeRate as unknown) as Permill
            );
            return price;
        })
    );
}

// Returns the amount of trade asset to pay for `sellAmount` of core sold.
function coreToAssetInputPriceAt(
    hash: Hash,
    assetId: AnyAssetId,
    coreAssetId: AnyAssetId,
    sellAmount: AnyNumber,
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
            getInputPrice(
                new u128(sellAmount),
                coreAssetReserve as any,
                tradeAssetReserve as any,
                (feeRate as unknown) as Permill
            )
        )
    );
}

function assetToAssetInputPrice(
    assetA: AnyAssetId,
    assetB: AnyAssetId,
    coreAssetId: EnhancedAssetId,
    sellAmount: AnyNumber,
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
            const saleValueA = getInputPrice(
                new u128(sellAmount),
                tradeAssetReserveA as any,
                coreAssetReserveA as any,
                (feeRate as unknown) as Permill
            );
            return getInputPrice(
                new u128(saleValueA),
                coreAssetReserveB as any,
                tradeAssetReserveB as any,
                (feeRate as unknown) as Permill
            );
        })
    );
}

function assetToAssetInputPriceAt(
    hash: Hash,
    assetA: AnyAssetId,
    assetB: AnyAssetId,
    coreAssetId: EnhancedAssetId,
    sellAmount: AnyNumber,
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
            const saleValueA = getInputPrice(
                new u128(sellAmount),
                tradeAssetReserveA as any,
                coreAssetReserveA as any,
                (feeRate as unknown) as Permill
            );
            return getInputPrice(
                new u128(saleValueA),
                coreAssetReserveB as any,
                tradeAssetReserveB as any,
                (feeRate as unknown) as Permill
            );
        })
    );
}
