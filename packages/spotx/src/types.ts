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

import {AnyAssetId} from '@cennznet/crml-generic-asset/types';
import {AccountId, AccountIndex, Address} from '@cennznet/types/polkadot';
import {AnyNumber, IHash} from '@cennznet/types/polkadot.types';
import BN from 'bn.js';
import {Observable} from 'rxjs';

export type AnyAddress = BN | Address | AccountId | AccountIndex | Array<number> | Uint8Array | number | string;

export interface QueryableGetLiquidityBalance {
    (assetId: AnyAssetId, address: AnyAddress): Promise<BN>;
    (assetId: AnyAssetId, address: AnyAddress, cb: (res: BN) => void): Promise<() => any>;
    at(hash: IHash, assetId: AnyAssetId, address: AnyAddress): Promise<BN>;
}

export interface QueryableGetLiquidityBalanceRx {
    (assetId: AnyAssetId, address: AnyAddress): Observable<BN>;
    at(hash: IHash, assetId: AnyAssetId, address: AnyAddress): Observable<BN>;
}

export interface QueryableTotalLiquidityBalance {
    (assetId: AnyAssetId): Promise<BN>;
    (assetId: AnyAssetId, cb: (res: BN) => void): Promise<() => any>;
    at(hash: IHash, assetId: AnyAssetId): Promise<BN>;
}

export interface QueryableTotalLiquidityBalanceRx {
    (assetId: AnyAssetId): Observable<BN>;
    at(hash: IHash, assetId: AnyAssetId): Observable<BN>;
}

export interface QueryablePrice {
    (assetA: AnyNumber, assetB: AnyNumber, amountBought: AnyNumber): Promise<BN>;
    (assetA: AnyNumber, assetB: AnyNumber, amountBought: AnyNumber, cb: (res: BN) => void): Promise<() => any>;
    at(hash: IHash, assetA: AnyNumber, assetB: AnyNumber, amountBought: AnyNumber): Promise<BN>;
}

export interface QueryablePriceRx {
    (assetA: AnyNumber, assetB: AnyNumber, amountBought: AnyNumber): Observable<BN>;
    at(hash: IHash, assetA: AnyNumber, assetB: AnyNumber, amountBought: AnyNumber): Observable<BN>;
}

export interface QueryableGetPoolBalance {
    (assetId: AnyAssetId): Promise<object>;
    (assetId: AnyAssetId, cb: (res: object) => void): Promise<() => any>;
    at(hash: IHash, assetId: AnyAssetId): Promise<object>;
}

export interface QueryableGetPoolBalanceRx {
    (assetId: AnyAssetId): Observable<object>;
    at(hash: IHash, assetId: AnyAssetId): Observable<object>;
}
