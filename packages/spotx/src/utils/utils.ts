import {decodeAddress} from '@polkadot/keyring';
import {u32, AccountId, Hash} from '@polkadot/types';
import {stringToU8a, u8aToHex} from '@polkadot/util';
import {xxhashAsHex} from '@polkadot/util-crypto';

/**
 * Generate the key of the balance storage
 * @param prefixString
 * @param assetId
 * @param address
 */
export function generateStorageDoubleMapKey(prefixString: string, key1: any, key2: any): string {
    // key1 encoded
    const prefixU8a: Uint8Array = stringToU8a(prefixString);
    const key1U8a: Uint8Array = new u32(key1).toU8a();
    const key1Encoded: Uint8Array = new Uint8Array(prefixU8a.length + key1U8a.length);
    key1Encoded.set(prefixU8a);
    key1Encoded.set(key1U8a, prefixU8a.length);
    // key2 encoded
    const length = 2;
    const key2Encoded: string = u8aToHex(decodeAddress(key2.toString())).substr(length);
    const bitLength: number = 128;

    return xxhashAsHex(key1Encoded, bitLength) + key2Encoded;
}

/**
 * Generate the key of the balance storage
 * @param prefixString
 * @param assetId
 * @param address
 */
export function generateExchangeAddress(prefixString: string, key1: any, key2: any): AccountId {
    // key1 encoded
    const prefixU8a: Uint8Array = stringToU8a(prefixString);
    const key1U8a: Uint8Array = new u32(key1).toU8a();
    const key2U8a: Uint8Array = new u32(key2).toU8a();
    const keyEncoded: Uint8Array = new Uint8Array(prefixU8a.length + key1U8a.length + key2U8a.length);
    keyEncoded.set(prefixU8a);
    keyEncoded.set(key1U8a, prefixU8a.length);
    keyEncoded.set(key1U8a, prefixU8a.length + key1U8a.length);
    const bitLength: number = 128;

    // const hash: string =  xxhashAsHex(key1Encoded, bitLength);
    return new AccountId(keyEncoded);
}