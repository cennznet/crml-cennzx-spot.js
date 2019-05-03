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
import {AnyAssetId} from '@cennznet/crml-generic-asset/types';
import {Hash, Permill, u128} from '@cennznet/types/polkadot';
import {AnyNumber} from '@cennznet/types/polkadot.types';
import BN from 'bn.js';
import {combineLatest, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {getOutputPrice} from '../utils/utils';
import {exchangeAddress} from './exchangeAddress';

export function assetToCoreOutputPrice(api: ApiInterface$Rx) {
    return (assetId: AnyAssetId, amountBought: AnyNumber): Observable<BN> => {
        const coreAssetId = api.query.cennzxSpot.coreAssetId();
        const defaultFeeRate = api.query.cennzxSpot.defaultFeeRate();
        return combineLatest(coreAssetId, exchangeAddress(api)(assetId), defaultFeeRate).pipe(
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
    };
}

export function assetToCoreOutputPriceAt(api: ApiInterface$Rx) {
    return (hash: Hash, assetId: AnyAssetId, amountBought: AnyNumber): Observable<BN> => {
        const coreAssetId = api.query.cennzxSpot.coreAssetId.at(hash);
        const defaultFeeRate = api.query.cennzxSpot.defaultFeeRate.at(hash);
        return combineLatest(coreAssetId, exchangeAddress(api)(assetId), defaultFeeRate).pipe(
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
