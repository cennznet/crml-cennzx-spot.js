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
import {AssetId} from '@cennznet/types';
import {Address, Permill, Tuple, u64} from '@cennznet/types/polkadot';
import {AnyNumber, Codec} from '@cennznet/types/polkadot.types';
import {blake2AsU8a, stringToU8a, u8aConcat} from '@cennznet/util';
import BN from 'bn.js';
import {PERMILL_BASE} from '../constants';

/**
 * Generate the key of the balance storage
 * @param prefixString
 * @param assetId
 * @param address
 */
export function generateExchangeAddress(coreAssetId: AnyNumber | AssetId, assetId: AnyNumber | AssetId): string {
    // key1 encoded
    const prefixU8a: Uint8Array = stringToU8a('cennz-x-spot:');
    const key1U8a: Uint8Array = new u64(coreAssetId).toU8a(true);
    const key2U8a: Uint8Array = new u64(assetId).toU8a(true);

    const keyEncoded = blake2AsU8a(u8aConcat(prefixU8a, key1U8a, key2U8a));
    return new Address(keyEncoded).toString();
}

/**
 * create exchange key
 * @param coreAssetId
 * @param assetId
 */
export function getExchangeKey(coreAssetId: AnyAssetId, assetId: AssetId | AnyNumber): Codec {
    return new Tuple([AssetId, AssetId], [coreAssetId, assetId]);
}

export function getOutputPrice(outputAmount: BN, inputReserve: BN, outputReserve: BN, feeRate: Permill): BN {
    if (inputReserve.isZero() || outputReserve.isZero()) {
        return new BN(0);
    }
    const output = inputReserve
        .mul(outputAmount)
        .div(outputReserve.sub(outputAmount))
        .addn(1);
    return feeRate
        .mul(output)
        .divn(PERMILL_BASE)
        .add(output);
}

export function getInputPrice(inputAmount: BN, inputReserve: BN, outputReserve: BN, feeRate: Permill): BN {
    if (inputReserve.isZero() || outputReserve.isZero()) {
        return new BN(0);
    }
    const divRate = feeRate.addn(PERMILL_BASE);
    const inputAmountLessFeeScaled = inputAmount
        .muln(PERMILL_BASE)
        .muln(PERMILL_BASE)
        .div(divRate);
    const numerator = inputAmountLessFeeScaled.mul(outputReserve);
    const denominator = inputAmount
        .muln(PERMILL_BASE)
        .div(divRate)
        .add(inputReserve);
    return numerator.div(denominator).divn(PERMILL_BASE);
}
