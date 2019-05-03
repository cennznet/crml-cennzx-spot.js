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

import {ApiRx} from '@cennznet/api';
import {SubmittableResult} from '@cennznet/api/polkadot';
import {QueryableStorageFunction, SubmittableExtrinsic} from '@cennznet/api/polkadot.types';
import {GenericAssetRx} from '@cennznet/crml-generic-asset';
import {AnyAssetId} from '@cennznet/crml-generic-asset/types';
import {AssetId} from '@cennznet/types';
import {AnyNumber} from '@cennznet/types/polkadot.types';
import {from, Observable, of} from 'rxjs';
import {mapTo, switchMap} from 'rxjs/operators';
import * as derives from './derives';
import {
    AnyAddress,
    QueryableAssetToCoreOutputPriceRx,
    QueryableExchangeAddressRx,
    QueryableGetLiquidityBalanceRx,
    QueryableTotalLiquidityBalanceRx,
} from './types';

export class CennzxSpotRx {
    static create(api: ApiRx): Observable<CennzxSpotRx> {
        let ga: Observable<GenericAssetRx>;
        if (api.genericAsset) {
            //remove type cast after cennzxnet/js next relase
            ga = of((api.genericAsset as unknown) as GenericAssetRx);
        } else {
            ga = GenericAssetRx.create(api);
        }
        return ga.pipe(
            switchMap(ga => {
                const cennzxSpot = new CennzxSpotRx(api, ga);
                (api as any)._options.derives = {...(api as any)._options.derives, cennzxSpot: derives};
                return from((api as any).loadMeta()).pipe(mapTo(cennzxSpot));
            })
        );
    }

    private readonly _api: ApiRx;
    private readonly _ga: GenericAssetRx;

    protected constructor(api: ApiRx, ga: GenericAssetRx) {
        this._api = api;
        if (api.genericAsset) {
            //remove type cast after cennzxnet/js next relase
            this._ga = (api.genericAsset as unknown) as GenericAssetRx;
        } else if (ga) {
            this._ga = ga;
        }
    }

    get api(): ApiRx {
        return this._api;
    }

    get ga(): GenericAssetRx {
        return this._ga;
    }

    /**
     * add liquidity
     * @param {assetId} - The trade asset ID
     * @param {minLiquidity} - The minimum liquidity to add
     * @param {maxAssetAmount} - Amount of trade asset to add
     * @param {coreAmount} - Amount of core asset to add
     */
    addLiquidity(
        assetId: AnyNumber,
        minLiquidity: AnyNumber,
        maxAssetAmount: AnyNumber,
        coreAmount: AnyNumber,
        expire: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.api.tx.cennzxSpot.addLiquidity(assetId, minLiquidity, maxAssetAmount, coreAmount) as any;
    }

    /**
     * query the cost of target asset to buy amountBought core asset
     * @param assetId assetId of target exchange pool
     * @param amountBought amount of core asset to buy
     */
    get getAssetToCoreOutputPrice(): QueryableAssetToCoreOutputPriceRx {
        const _fn = this.api.derive.cennzxSpot.assetToCoreOutputPrice as any;
        _fn.at = this.api.derive.cennzxSpot.assetToCoreOutputPriceAt as any;

        return _fn;
    }

    /**
     * remove liquidity
     * @param assetId - The asset to remove
     * @param assetAmount - Amount of exchange asset to burn
     * @param minAssetWithdraw - The minimum trade asset withdrawn
     * @param minCoreWithdraw - The minimum core asset withdrawn
     */
    removeLiquidity(
        assetId: AnyAssetId,
        assetAmount: AnyNumber,
        minAssetWithdraw: AnyNumber,
        minCoreAssetWithdraw: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.api.tx.cennzxSpot.removeLiquidity(
            assetId,
            assetAmount,
            minAssetWithdraw,
            minCoreAssetWithdraw
        ) as any;
    }

    /**
     * Asset 1 to asset 2 swap output
     * @param assetSold The asset to sell
     * @param assetBuy The asset to Buy
     * @param amountBought amount of asset 2 to buy
     * @param maxAmountSold maximum amount of asset 1 allowed to sell
     */
    assetSwapOutput(
        assetSold: AnyAssetId,
        assetBought: AnyAssetId,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.api.tx.cennzxSpot.assetSwapOutput(null, assetSold, assetBought, amountBought, maxAmountSold) as any;
    }

    /**
     * Asset 1 to asset 2 transfer output
     * @param recipient - The address that receives the output asset
     * @param assetSold The asset to sell
     * @param assetBuy The asset to buy
     * @param amountBought amount of asset 2 to buy
     * @param maxAmountSold maximum amount of asset allowed to sell
     */
    assetTransferOutput(
        recipient: AnyAddress,
        assetSold: AnyAssetId,
        assetBought: AnyAssetId,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.api.tx.cennzxSpot.assetSwapOutput(
            recipient,
            assetSold,
            assetBought,
            amountBought,
            maxAmountSold
        ) as any;
    }

    /**
     * Asset 1 to asset 2 swap input
     * @param assetSold The asset to sell
     * @param assetBuy The asset to buy
     * @param sellAmount amount of trade asset 1 to sell
     * @param minSale Min trade asset 2 to receive from sale (output)
     */
    assetSwapInput(
        assetSold: AnyAssetId,
        assetBought: AnyAssetId,
        sellAmount: AnyNumber,
        minSale: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.api.tx.cennzxSpot.assetSwapInput(null, assetSold, assetBought, sellAmount, minSale) as any;
    }

    /**
     * Asset 1 to asset 2 transfer input
     * @param recipient - The address that receives the output asset
     * @param assetSold The asset to sell
     * @param assetBuy The asset to buy
     * @param sellAmount amount of trade asset to sell
     * @param minSale Min core asset to receive from sale (output)
     */
    assetTransferInput(
        recipient: AnyAddress,
        assetSold: AnyAssetId,
        assetBought: AnyAssetId,
        sellAmount: AnyNumber,
        minSale: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.api.tx.cennzxSpot.assetSwapInput(recipient, assetSold, assetBought, sellAmount, minSale) as any;
    }

    /**
     * Query the total liquidity of an exchange pool
     */
    get getTotalLiquidity(): QueryableTotalLiquidityBalanceRx {
        const _fn = this.api.derive.cennzxSpot.totalLiquidity as any;
        _fn.at = this.api.derive.cennzxSpot.totalLiquidityAt as any;

        return _fn;
    }

    get getExchangeAddress(): QueryableExchangeAddressRx {
        return this.api.derive.cennzxSpot.exchangeAddress as any;
    }

    /**
     * Query the core asset id
     */
    get getCoreAssetId(): QueryableStorageFunction<Observable<AssetId>, {}> {
        return this.api.query.cennzxSpot.coreAssetId as any;
    }

    /**
     * Query the fee rate
     */
    get getFeeRate(): QueryableStorageFunction<Observable<AssetId>, {}> {
        return this.api.query.cennzxSpot.defaultFeeRate as any;
    }

    // tslint:disable:member-ordering
    /**
     * Query liquidity balance for an account
     * @param {(AnyNumber,AnyNumber)} coreAssetIs, assetId The id of the asset
     * @param {AnyAddress} address The address of the account
     */
    get getLiquidityBalance(): QueryableGetLiquidityBalanceRx {
        const _fn = this.api.derive.cennzxSpot.liquidityBalance as any;
        _fn.at = this.api.derive.cennzxSpot.liquidityBalanceAt as any;

        return _fn;
    }
}
