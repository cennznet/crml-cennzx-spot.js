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


export function poolBalance(api: ApiInterface$Rx) {
    return (assetId: AnyAssetId): Observable<any> => {
        return combineLatest([exchangeAddress(api)(assetId), api.query.cennzxSpot.coreAssetId()]).pipe(
            switchMap(([exchangeAddress, coreAssetId]) =>
                combineLatest([
                    api.derive.genericAsset.freeBalance(assetId, exchangeAddress),
                    api.derive.genericAsset.freeBalance(coreAssetId, exchangeAddress)],
                ).pipe(map(([tradeAssetReserve, coreAssetReserve]) => [{assetId: tradeAssetReserve.toString(), coreAssetId: coreAssetReserve.toString()}])),
            ),
            drr()
        );
    };
}

export function poolBalanceAt(api: ApiInterface$Rx) {
    return (hash: Hash, assetId: AnyAssetId): Observable<any> => {
        return combineLatest([exchangeAddress(api)(assetId), api.query.cennzxSpot.coreAssetId.at(hash)]).pipe(
            switchMap(([exchangeAddress, coreAssetId]) =>
                combineLatest([
                    api.derive.genericAsset.freeBalanceAt(hash, assetId, exchangeAddress),
                    api.derive.genericAsset.freeBalanceAt(hash, coreAssetId, exchangeAddress)],
                ).pipe(map(([tradeAssetReserve, coreAssetReserve]) => [{assetId: tradeAssetReserve.toString(), coreAssetId: coreAssetReserve.toString()}])),
            ),
           drr()
        );
    };
}
