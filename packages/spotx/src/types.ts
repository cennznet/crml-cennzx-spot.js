import {AnyAssetId} from '@cennznet/generic-asset/dist/types';
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

export interface QueryableExchangeAddress {
    (assetId: AnyAssetId): Promise<string>;
}

export interface QueryableExchangeAddressRx {
    (assetId: AnyAssetId): Promise<string>;
}

export interface QueryableAssetToCoreOutputPrice {
    (assetId: AnyNumber, amountBought: AnyNumber): Promise<BN>;
    (assetId: AnyNumber, amountBought: AnyNumber, cb: (res: BN) => void): Promise<() => any>;
    at(hash: IHash, assetId: AnyNumber, amountBought: AnyNumber): Promise<BN>;
}

export interface QueryableAssetToCoreOutputPriceRx {
    (assetId: AnyNumber, amountBought: AnyNumber): Observable<BN>;
    at(hash: IHash, assetId: AnyNumber, amountBought: AnyNumber): Observable<BN>;
}
