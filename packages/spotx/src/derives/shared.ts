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
import {AssetId} from '@cennznet/types';
import {Hash} from '@cennznet/types/polkadot';
import {drr} from '@plugnet/api-derive/util/drr';
import {Observable} from 'rxjs';

export function coreAssetId(api: ApiInterface$Rx) {
    return (): Observable<AssetId> => api.query.cennzxSpot.coreAssetId().pipe(drr()) as Observable<AssetId>;
}

export function coreAssetIdAt(api: ApiInterface$Rx) {
    return (hash: Hash): Observable<AssetId> =>
        api.query.cennzxSpot.coreAssetId.at(hash).pipe(drr()) as Observable<AssetId>;
}
