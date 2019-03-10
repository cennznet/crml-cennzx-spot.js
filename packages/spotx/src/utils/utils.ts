import {AssetId} from '@cennznet/types';
import {Address, u64} from '@cennznet/types/polkadot';
import {AnyNumber, Codec} from '@cennznet/types/polkadot.types';
import {blake2AsU8a, stringToU8a, u8aConcat, u8aToHex, xxhashAsHex} from '@cennznet/util';

/**
 * Generate the key of the balance storage
 * @param prefixString
 * @param assetId
 * @param address
 */
export function generateStorageDoubleMapKey(prefixString: string, key1: Codec, key2: Codec): string {
    // key1 encoded
    const prefixU8a: Uint8Array = stringToU8a(prefixString);
    const key1U8a: Uint8Array = key1.toU8a(true);
    const key1Encoded: Uint8Array = new Uint8Array(prefixU8a.length + key1U8a.length);
    key1Encoded.set(prefixU8a);
    key1Encoded.set(key1U8a, prefixU8a.length);
    // key2 encoded
    const length = 2;
    const key2Encoded: string = u8aToHex(key2.toU8a(true)).substr(length);
    const bitLength: number = 128;

    return xxhashAsHex(key1Encoded, bitLength) + key2Encoded;
}

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
