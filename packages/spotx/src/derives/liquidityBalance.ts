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
import {AccountId, Address, Balance, Hash} from '@cennznet/types/polkadot';
import {drr} from '@plugnet/api-derive/util/drr';
import BN from 'bn.js';
import {Observable} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {AnyAddress} from '../types';
import {getExchangeKey} from '../utils/utils';

export function liquidityBalance(api: ApiInterface$Rx) {
    return (assetId: AnyAssetId, address: AnyAddress): Observable<BN> => {
        return api.query.cennzxSpot.coreAssetId().pipe(
            switchMap(coreAssetId => {
                return api.query.cennzxSpot.liquidityBalance(
                    getExchangeKey(coreAssetId as any, assetId),
                    address
                ) as Observable<Balance>;
            }),
            drr()
        );
    };
}

export function liquidityBalanceAt(api: ApiInterface$Rx) {
    return (hash: Hash, assetId: AnyAssetId, address: AnyAddress): Observable<BN> => {
        return api.query.cennzxSpot.coreAssetId.at(hash).pipe(
            switchMap(
                coreAssetId =>
                    api.query.cennzxSpot.liquidityBalance.at(
                        hash,
                        getExchangeKey(coreAssetId as any, assetId),
                        address
                    ) as Observable<Balance>
            ),
            drr()
        );
    };
}
