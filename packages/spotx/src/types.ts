import {AccountId, AccountIndex, Address, Hash} from '@polkadot/types';
import {AnyNumber} from '@polkadot/types/types';
import BN from 'bn.js';

export type AnyAddress = BN | Address | AccountId | AccountIndex | Array<number> | Uint8Array | number | string;

export type ExchangeKey<T> = (AnyNumber, AnyNumber);

export interface QueryableGenerateExchangeAddress {

}

export interface QueryableGetLiquidityBalance {
    ((coreAssetId: AnyNumber, assetId: AnyNumber), address: AnyAddress, cb?: any): Promise<BN | (() => any)>;
    at(coreAssetId: AnyNumber, assetId: AnyNumber), address: AnyAddress, hash: Hash): Promise<BN>;
}