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
import {Hash, u128} from '@cennznet/types/polkadot';
import {AnyNumber} from '@cennznet/types/polkadot.types';
import BN from 'bn.js';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {getLiquidityWithdrawn} from '../utils/utils';
import {poolCoreAssetBalance, poolCoreAssetBalanceAt} from './poolBalance';
import {totalLiquidity, totalLiquidityAt} from './totalLiquidity';

export function liquidityWithdrawn(api: ApiInterface$Rx) {
    return (assetId: AnyAssetId, coreAmount: AnyNumber): Observable<BN> => {
        return combineLatest([poolCoreAssetBalance(api)(assetId), totalLiquidity(api)(assetId)]).pipe(
            map(([coreAssetReserve, totalLiquidity]) =>
                getLiquidityWithdrawn(new BN(coreAmount), coreAssetReserve as any, totalLiquidity as any)
            )
        );
    };
}

export function liquidityWithdrawnAt(api: ApiInterface$Rx) {
    return (hash: Hash, assetId: AnyAssetId, coreAmount: AnyNumber): Observable<BN> => {
        return combineLatest([poolCoreAssetBalanceAt(api)(hash, assetId), totalLiquidityAt(api)(hash, assetId)]).pipe(
            map(([coreAssetReserve, totalLiquidity]) =>
                getLiquidityWithdrawn(new BN(coreAmount), coreAssetReserve as any, totalLiquidity as any)
            )
        );
    };
}
