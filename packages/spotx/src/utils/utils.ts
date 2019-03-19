import {AnyAssetId} from '@cennznet/generic-asset/dist/types';
import {AssetId} from '@cennznet/types';
import {Address, u64, Tuple, Permill} from '@cennznet/types/polkadot';
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
