import {Api} from '@cennznet/api';
import {QueryableStorageFunction, SubmittableExtrinsic} from '@cennznet/api/polkadot.types';
import {GenericAsset} from '@cennznet/generic-asset';
import {AnyAssetId} from '@cennznet/generic-asset/dist/types';
import {AssetId} from '@cennznet/types';
import {AnyNumber, IHash} from '@cennznet/types/polkadot.types';
import * as derives from './derives';
import {
    AnyAddress,
    QueryableAssetToCoreOutputPrice,
    QueryableExchangeAddress,
    QueryableGetLiquidityBalance,
    QueryableTotalLiquidityBalance,
} from './types';

export class SpotX {
    static async create(api: Api): Promise<SpotX> {
        const ga = await GenericAsset.create(api);
        const spotX = new SpotX(api, ga);
        (api as any)._options.derives = {...(api as any)._options.derives, spotX: derives};
        await (api as any).loadMeta();
        return spotX;
    }

    private _api: Api;
    private _ga: GenericAsset;

    protected constructor(api: Api, ga: GenericAsset) {
        this._api = api;
        this._ga = ga;
    }

    get api(): Api {
        return this._api;
    }

    get ga(): GenericAsset {
        return this._ga;
    }

    /**
     * add liquidity
     * @param {IAssetOptions} options Initialization options of an asset
     *
     */
    addLiquidity(
        assetId: AnyAssetId,
        minLiquidity: AnyNumber,
        maxAssetAmount: AnyNumber,
        coreAmount: AnyNumber
    ): SubmittableExtrinsic<Promise<IHash>, Promise<() => any>> {
        return this.api.tx.cennzX.addLiquidity(assetId, minLiquidity, maxAssetAmount, coreAmount);
    }

    /**
     * query the cost of target asset to buy amountBought core asset
     * @param assetId assetId of target exchange pool
     * @param amountBought amount of core asset to buy
     */
    get getAssetToCoreOutputPrice(): QueryableAssetToCoreOutputPrice {
        const _fn = this.api.derive.spotX.assetToCoreOutputPrice as any;
        _fn.at = this.api.derive.spotX.assetToCoreOutputPriceAt as any;

        return _fn;
    }

    /**
     * query the cost of core asset to buy amountBought target asset
     * @param assetId assetId of target exchange pool
     * @param amountBought amount of target asset to buy
     */
    get getCoreToAssetOutputPrice(): QueryableAssetToCoreOutputPrice {
        const _fn = this.api.derive.spotX.coreToAssetOutputPrice as any;
        _fn.at = this.api.derive.spotX.coreToAssetOutputPriceAt as any;

        return _fn;
    }

    /**
     * Asset to core swap output
     * @param assetId The asset to sell
     * @param amountBought amount of core asset to buy
     * @param maxAmountSold maximum amount of asset allowed to sell
     */
    assetToCoreSwapOutput(
        assetId: AnyAssetId,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Promise<IHash>, Promise<() => any>> {
        return this.api.tx.cennzX.assetToCoreSwapOutput(assetId, amountBought, maxAmountSold);
    }

    /**
     * Asset to core swap output
     * @param {AnyNumber} assetId The id of the transferred asset
     * @param {AnyAddress} dest The address of the destination account
     * @param {AnyNumber} amount The amount to be transferred
     */
    coreToAssetSwapOutput(
        assetId: AnyAssetId,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Promise<IHash>, Promise<() => any>> {
        return this.api.tx.cennzX.coreToAssetSwapOutput(assetId, amountBought, maxAmountSold);
    }

    /**
     * Asset to core transfer output
     * @param assetId The asset to sell
     * @param amountBought amount of core asset to buy
     * @param maxAmountSold maximum amount of asset allowed to sell
     */
    assetToCoreTransferOutput(
        recipient: AnyAddress,
        assetId: AnyAssetId,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Promise<IHash>, Promise<() => any>> {
        return this.api.tx.cennzX.assetToCoreTransferOutput(recipient, assetId, amountBought, maxAmountSold);
    }

    /**
     * Asset to core transfer output
     * @param assetId The asset to sell
     * @param amountBought amount of core asset to buy
     * @param maxAmountSold maximum amount of asset allowed to sell
     */
    coreToAssetTransferOutput(
        recipient: AnyAddress,
        assetId: AnyAssetId,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Promise<IHash>, Promise<() => any>> {
        return this.api.tx.cennzX.coreToAssetTransferOutput(recipient, assetId, amountBought, maxAmountSold);
    }

    /**
     * remove liquidity
     * @param assetId - The asset to remove
     * @param assetAmount - Amount of exchange asset to burn
     * @param `min_asset_withdraw` - The minimum trade asset withdrawn
     * @param `min_asset_withdraw` - The minimum trade asset withdrawn
     */
    removeLiquidity(
        assetId: AnyAssetId,
        assetAmount: AnyNumber,
        minAssetWithdraw: AnyNumber,
        minCoreAssetWithdraw: AnyNumber
    ): SubmittableExtrinsic<Promise<IHash>, Promise<() => any>> {
        return this.api.tx.cennzX.removeLiquidity(assetId, assetAmount, minAssetWithdraw, minCoreAssetWithdraw);
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
     * Query the core asset idit
     */
    get getCoreAssetId(): QueryableStorageFunction<Promise<AssetId>, Promise<() => any>> {
        return this.api.query.cennzX.coreAssetId as any;
    }

    /**
     * Query the core asset idit
     */
    get getFeeRate(): QueryableStorageFunction<Promise<AssetId>, Promise<() => any>> {
        return this.api.query.cennzX.feeRate as any;
    }

    // tslint:disable:member-ordering
    /**
     * Query liquidity balance for an account
     * @param {(AnyNumber,AnyNumber)} coreAssetIs, assetId The id of the asset
     * @param {AnyAddress} address The address of the account
     */
    get getLiquidityBalance(): QueryableGetLiquidityBalance {
        const _fn = this.api.derive.spotX.liquidityBalance as any;
        _fn.at = this.api.derive.spotX.liquidityBalanceAt as any;

        return _fn;
    }
}
