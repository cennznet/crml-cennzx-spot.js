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

import {Api} from '@cennznet/api';
import {QueryableStorageFunction, SubmittableExtrinsic} from '@cennznet/api/polkadot.types';
import {GenericAsset} from '@cennznet/crml-generic-asset';
import {AnyAssetId} from '@cennznet/crml-generic-asset/types';
import {AssetId} from '@cennznet/types';
import {AnyNumber, IHash} from '@cennznet/types/polkadot.types';
import {assert} from '@cennznet/util';
import * as derives from './derives';
import {
    AnyAddress,
    QueryableExchangeAddress,
    QueryableGetLiquidityBalance,
    QueryablePrice,
    QueryableTotalLiquidityBalance,
} from './types';

export class CennzxSpot {
    static async create(api: Api): Promise<CennzxSpot> {
        if (api.cennzxSpot) {
            return api.cennzxSpot;
        }
        const ga = api.genericAsset ? api.genericAsset : await GenericAsset.create(api);
        (api as any)._options.derives = {...(api as any)._options.derives, cennzxSpot: derives};
        await (api as any).loadMeta();
        return new CennzxSpot(api, ga);
    }

    private _api: Api;
    private _ga: GenericAsset;

    constructor(api: Api, ga?: GenericAsset) {
        assert(
            (api as any)._options.derives.cennzxSpot || ((api as any)._derive || {}).cennzxSpot,
            "init cennzx spot's derives first"
        );
        this._api = api;
        if (api.genericAsset) {
            this._ga = api.genericAsset;
        } else if (ga) {
            this._ga = ga;
        } else {
            throw new Error('genericAsset is not found');
        }
    }

    get api(): Api {
        return this._api;
    }

    get ga(): GenericAsset {
        return this._ga;
    }

    set ga(ga: GenericAsset) {
        this._ga = ga;
    }

    /**
     * add liquidity
     * @param {assetId} - The trade asset ID
     * @param {minLiquidity} - The minimum liquidity to add
     * @param {maxAssetAmount} - Amount of trade asset to add
     * @param {coreAmount} - Amount of core asset to add
     */
    addLiquidity(
        assetId: AnyAssetId,
        minLiquidity: AnyNumber,
        maxAssetAmount: AnyNumber,
        coreAmount: AnyNumber
    ): SubmittableExtrinsic<Promise<IHash>, Promise<() => any>> {
        return this.api.tx.cennzxSpot.addLiquidity(assetId, minLiquidity, maxAssetAmount, coreAmount);
    }

    /**
     * query the price to buy amountBought asset
     * @param assetId assetId of target exchange pool
     * @param coreAssetId core assetId of target exchange pool
     * @param amountBought amount of core asset to buy
     * @param feeRate - The % of exchange fees for the trade
     */
    get getOutputPrice(): QueryablePrice {
        const _fn = this.api.derive.cennzxSpot.outputPrice as any;
        _fn.at = this.api.derive.cennzxSpot.outputPriceAt as any;

        return _fn;
    }

    /**
     * query the price to sell asset of #amount
     * @param assetId assetId of target exchange pool
     * @param coreAssetId core assetId of target exchange pool
     * @param amountBought amount of core asset to buy
     * @param feeRate - The % of exchange fees for the trade
     */
    get getInputPrice(): QueryablePrice {
        const _fn = this.api.derive.cennzxSpot.inputPrice as any;
        _fn.at = this.api.derive.cennzxSpot.inputPriceAt as any;

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
    ): SubmittableExtrinsic<Promise<IHash>, Promise<() => any>> {
        return this.api.tx.cennzxSpot.removeLiquidity(assetId, assetAmount, minAssetWithdraw, minCoreAssetWithdraw);
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
    ): SubmittableExtrinsic<Promise<IHash>, Promise<() => any>> {
        return this.api.tx.cennzxSpot.assetSwapOutput(null, assetSold, assetBought, amountBought, maxAmountSold);
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
    ): SubmittableExtrinsic<Promise<IHash>, Promise<() => any>> {
        return this.api.tx.cennzxSpot.assetSwapOutput(recipient, assetSold, assetBought, amountBought, maxAmountSold);
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
    ): SubmittableExtrinsic<Promise<IHash>, Promise<() => any>> {
        return this.api.tx.cennzxSpot.assetSwapInput(null, assetSold, assetBought, sellAmount, minSale);
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
    ): SubmittableExtrinsic<Promise<IHash>, Promise<() => any>> {
        return this.api.tx.cennzxSpot.assetSwapInput(recipient, assetSold, assetBought, sellAmount, minSale);
    }

    /**
     * Query the total liquidity of an exchange pool
     */
    get getTotalLiquidity(): QueryableTotalLiquidityBalance {
        const _fn = this.api.derive.spotX.totalLiquidity as any;
        _fn.at = this.api.derive.spotX.totalLiquidityAt as any;

        return _fn;
    }

    get getExchangeAddress(): QueryableExchangeAddress {
        return this.api.derive.spotX.exchangeAddress as any;
    }

    /**
     * Query the core asset id
     */
    get getCoreAssetId(): QueryableStorageFunction<Promise<AssetId>, Promise<() => any>> {
        return this.api.query.cennzxSpot.coreAssetId as any;
    }

    /**
     * Query the fee rate
     */
    get getFeeRate(): QueryableStorageFunction<Promise<AssetId>, Promise<() => any>> {
        return this.api.query.cennzxSpot.defaultFeeRate as any;
    }

    // tslint:disable:member-ordering
    /**
     * Query liquidity balance for an account
     * @param {(AnyNumber,AnyNumber)} coreAssetIs, assetId The id of the asset
     * @param {AnyAddress} address The address of the account
     */
    get getLiquidityBalance(): QueryableGetLiquidityBalance {
        const _fn = this.api.derive.cennzxSpot.liquidityBalance as any;
        _fn.at = this.api.derive.cennzxSpot.liquidityBalanceAt as any;

        return _fn;
    }
}
