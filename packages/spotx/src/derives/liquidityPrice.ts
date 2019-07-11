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
import {
    poolAssetBalance,
    poolAssetBalanceAt,
    poolCoreAssetBalance,
    poolCoreAssetBalanceAt,
} from '@cennznet/crml-cennzx-spot/derives/poolBalance';
import {getLiquidityPrice} from '@cennznet/crml-cennzx-spot/utils/utils';
import {AnyAssetId} from '@cennznet/crml-generic-asset/types';
import {Hash, u128} from '@cennznet/types/polkadot';
import {AnyNumber} from '@cennznet/types/polkadot.types';
import BN from 'bn.js';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

export function liquidityPrice(api: ApiInterface$Rx) {
    return (assetId: AnyAssetId, coreAmount: AnyNumber): Observable<BN> => {
        return combineLatest([poolAssetBalance(api)(assetId), poolCoreAssetBalance(api)(assetId)]).pipe(
            map(([tradeAssetReserve, coreAssetReserve]) =>
                getLiquidityPrice(new u128(coreAmount), coreAssetReserve as any, tradeAssetReserve as any)
            )
        );
    };
}

export function liquidityPriceAt(api: ApiInterface$Rx) {
    return (hash: Hash, assetId: AnyAssetId, coreAmount: AnyNumber): Observable<BN> => {
        return combineLatest([poolAssetBalanceAt(api)(hash, assetId), poolCoreAssetBalanceAt(api)(hash, assetId)]).pipe(
            map(([tradeAssetReserve, coreAssetReserve]) =>
                getLiquidityPrice(new u128(coreAmount), coreAssetReserve as any, tradeAssetReserve as any)
            )
        );
    };
}
