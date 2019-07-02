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
import {Hash} from '@cennznet/types/polkadot';
import {drr} from '@plugnet/api-derive/util/drr';
import {combineLatest, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {exchangeAddress} from './exchangeAddress';

export function poolAssetBalance(api: ApiInterface$Rx) {
    return (assetId: AnyAssetId): Observable<any> => {
        return exchangeAddress(api)(assetId).pipe(
            switchMap(exchangeAddress => api.derive.genericAsset.freeBalance(assetId, exchangeAddress)),
            drr()
        );
    };
}

export function poolCoreAssetBalance(api: ApiInterface$Rx) {
    return (assetId: AnyAssetId): Observable<any> => {
        return combineLatest([exchangeAddress(api)(assetId), api.query.cennzxSpot.coreAssetId()]).pipe(
            switchMap(([exchangeAddress, coreAssetId]) =>
                api.derive.genericAsset.freeBalance(coreAssetId, exchangeAddress)
            ),
            drr()
        );
    };
}

export function poolAssetBalanceAt(api: ApiInterface$Rx) {
    return (hash: Hash, assetId: AnyAssetId): Observable<any> => {
        return exchangeAddress(api)(assetId).pipe(
            switchMap(exchangeAddress => api.derive.genericAsset.freeBalanceAt(hash, assetId, exchangeAddress)),
            drr()
        );
    };
}

export function poolCoreAssetBalanceAt(api: ApiInterface$Rx) {
    return (hash: Hash, assetId: AnyAssetId): Observable<any> => {
        return combineLatest([exchangeAddress(api)(assetId), api.query.cennzxSpot.coreAssetId()]).pipe(
            switchMap(([exchangeAddress, coreAssetId]) =>
                api.derive.genericAsset.freeBalanceAt(hash, coreAssetId, exchangeAddress)
            ),
            drr()
        );
    };
}
