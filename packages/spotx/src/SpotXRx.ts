import {ApiRx} from '@cennznet/api';
import {SubmittableResult} from '@cennznet/api/polkadot';
import {QueryableStorageFunction, SubmittableExtrinsic} from '@cennznet/api/polkadot.types';
import {GenericAssetRx} from '@cennznet/generic-asset';
import {AnyAssetId} from '@cennznet/generic-asset/dist/types';
import {AssetId} from '@cennznet/types';
import {AnyNumber} from '@cennznet/types/polkadot.types';
import {from, Observable} from 'rxjs';
import {mapTo, switchMap} from 'rxjs/operators';
import * as derives from './derives';
import {
    AnyAddress,
    QueryableAssetToCoreOutputPriceRx,
    QueryableExchangeAddressRx,
    QueryableGetLiquidityBalanceRx,
    QueryableTotalLiquidityBalanceRx,
} from './types';

export class SpotXRx {
    static create(api: ApiRx): Observable<SpotXRx> {
        return GenericAssetRx.create(api).pipe(
            switchMap(ga => {
                const cennzxSpot = new SpotXRx(api, ga);
                (api as any)._options.derives = {...(api as any)._options.derives, cennzxSpot: derives};
                return from((api as any).loadMeta()).pipe(mapTo(cennzxSpot));
            })
        );
    }

    private readonly _api: ApiRx;
    private readonly _ga: GenericAssetRx;

    protected constructor(api: ApiRx, ga: GenericAssetRx) {
        this._api = api;
        this._ga = ga;
    }

    get api(): ApiRx {
        return this._api;
    }

    get ga(): GenericAssetRx {
        return this._ga;
    }

    // TODO: This code can be removed once the rename (cennzX ~ cennzxSpot) is applied on all blockchain networks.
    private get spotXTx(): any {
        return this.api.tx.cennzX ? this.api.tx.cennzX : this.api.tx.cennzxSpot;
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
        return this.spotXTx.addLiquidity(assetId, minLiquidity, maxAssetAmount, coreAmount) as any;
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
     * Asset to core swap output
     * @param assetId The asset to sell
     * @param amountBought amount of core asset to buy
     * @param maxAmountSold maximum amount of asset allowed to sell
     */
    assetToCoreSwapOutput(
        assetId: AnyNumber,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.spotXTx.assetToCoreSwapOutput(null, assetId, amountBought, maxAmountSold) as any;
    }

    /**
     * Asset to core swap output
     * @param assetId The id of the transferred asset
     * @param amountBought amount of trade asset to buy
     * @param maxAmountSold maximum amount of core asset allowed to sell
     */
    coreToAssetSwapOutput(
        assetId: AnyNumber,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.spotXTx.coreToAssetSwapOutput(null, assetId, amountBought, maxAmountSold) as any;
    }

    /**
     * Asset to core transfer output
     * @param recipient - Receiver of core asset
     * @param assetId The asset to sell
     * @param amountBought amount of core asset to buy
     * @param maxAmountSold maximum amount of asset allowed to sell
     */
    assetToCoreTransferOutput(
        recipient: AnyAddress,
        assetId: AnyAssetId,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.spotXTx.assetToCoreSwapOutput(recipient, assetId, amountBought, maxAmountSold) as any;
    }

    /**
     * Asset to core transfer output
     * @param recipient - Receiver of trade asset
     * @param assetId The asset to sell
     * @param amountBought amount of trade asset to buy
     * @param maxAmountSold maximum amount of asset allowed to sell
     */
    coreToAssetTransferOutput(
        recipient: AnyAddress,
        assetId: AnyAssetId,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.spotXTx.coreToAssetSwapOutput(recipient, assetId, amountBought, maxAmountSold) as any;
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
        return this.spotXTx.removeLiquidity(assetId, assetAmount, minAssetWithdraw, minCoreAssetWithdraw) as any;
    }

    /**
     * Asset 1 to asset 2 swap output
     * @param assetSold The asset to sell
     * @param assetBuy The asset to Buy
     * @param amountBought amount of asset 2 to buy
     * @param maxAmountSold maximum amount of asset 1 allowed to sell
     */
    assetToAssetSwapOutput(
        assetSold: AnyAssetId,
        assetBought: AnyAssetId,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.spotXTx.assetToAssetSwapOutput(null, assetSold, assetBought, amountBought, maxAmountSold) as any;
    }

    /**
     * Asset 1 to asset 2 transfer output
     * @param recipient - The address that receives the output asset
     * @param assetSold The asset to sell
     * @param assetBuy The asset to buy
     * @param amountBought amount of asset 2 to buy
     * @param maxAmountSold maximum amount of asset allowed to sell
     */
    assetToAssetTransferOutput(
        recipient: AnyAddress,
        assetSold: AnyAssetId,
        assetBought: AnyAssetId,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.spotXTx.assetToAssetSwapOutput(
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
    assetToAssetSwapInput(
        assetSold: AnyAssetId,
        assetBought: AnyAssetId,
        sellAmount: AnyNumber,
        minSale: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.spotXTx.assetToAssetSwapInput(null, assetSold, assetBought, sellAmount, minSale) as any;
    }

    /**
     * Asset 1 to asset 2 transfer input
     * @param recipient - The address that receives the output asset
     * @param assetSold The asset to sell
     * @param assetBuy The asset to buy
     * @param sellAmount amount of trade asset to sell
     * @param minSale Min core asset to receive from sale (output)
     */
    assetToAssetTransferInput(
        recipient: AnyAddress,
        assetSold: AnyAssetId,
        assetBought: AnyAssetId,
        sellAmount: AnyNumber,
        minSale: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.spotXTx.assetToAssetSwapInput(recipient, assetSold, assetBought, sellAmount, minSale) as any;
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
