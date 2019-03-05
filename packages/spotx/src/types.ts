import {AccountId, AccountIndex, Address, Hash} from '@polkadot/types';
import {AnyNumber} from '@polkadot/types/types';
import BN from 'bn.js';

export type AnyAddress = BN | Address | AccountId | AccountIndex | Array<number> | Uint8Array | number | string;

export type ExchangeKey = [AnyNumber, AnyNumber];

export interface QueryableGenerateExchangeAddress {

}

export interface QueryableGetLiquidityBalance {
    (assetId: AnyNumber, address: AnyAddress): Promise<BN>;
    (assetId: AnyNumber, address: AnyAddress, cb: (res: BN)=>void): Promise<() => any>;
    // (assetId: AnyNumber, address: AnyAddress, cb?: any): Promise<BN | (() => any)>;
    at(assetId: AnyNumber, address: AnyAddress, hash: Hash): Promise<BN>;
}
