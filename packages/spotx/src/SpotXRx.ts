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
                const spotX = new SpotXRx(api, ga);
                (api as any)._options.derives = {...(api as any)._options.derives, sportX: derives};
                return from((api as any).loadMeta()).pipe(mapTo(spotX));
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

    /**
     * add liquidity
     * @param {IAssetOptions} options Initialization options of an asset
     */
    addLiquidity(
        assetId: AnyNumber,
        minLiquidity: AnyNumber,
        maxAssetAmount: AnyNumber,
        coreAmount: AnyNumber,
        expire: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.api.tx.cennzX.addLiquidity(assetId, minLiquidity, maxAssetAmount, coreAmount) as any;
    }

    /**
     * query the cost of target asset to buy amountBought core asset
     * @param assetId assetId of target exchange pool
     * @param amountBought amount of core asset to buy
     */
    get getAssetToCoreOutputPrice(): QueryableAssetToCoreOutputPriceRx {
        const _fn = this.api.derive.spotX.assetToCoreOutputPrice as any;
        _fn.at = this.api.derive.spotX.assetToCoreOutputPriceAt as any;

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
        return this.api.tx.cennzX.assetToCoreSwapOutput(assetId, amountBought, maxAmountSold) as any;
    }

    /**
     * Asset to core swap output
     * @param {AnyNumber} assetId The id of the transferred asset
     * @param {AnyAddress} dest The address of the destination account
     * @param {AnyNumber} amount The amount to be transferred
     */
    coreToAssetSwapOutput(
        assetId: AnyNumber,
        amountBought: AnyNumber,
        maxAmountSold: AnyNumber
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.api.tx.cennzX.coreToAssetSwapOutput(assetId, amountBought, maxAmountSold) as any;
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
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.api.tx.cennzX.assetToCoreTransferOutput(recipient, assetId, amountBought, maxAmountSold) as any;
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
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.api.tx.cennzX.coreToAssetTransferOutput(recipient, assetId, amountBought, maxAmountSold) as any;
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
    ): SubmittableExtrinsic<Observable<SubmittableResult>, {}> {
        return this.api.tx.cennzX.removeLiquidity(assetId, assetAmount, minAssetWithdraw, minCoreAssetWithdraw) as any;
    }

    /**
     * Query the total liquidity of an exchange pool
     */
    get getTotalLiquidity(): QueryableTotalLiquidityBalanceRx {
        const _fn = this.api.derive.spotX.totalLiquidity as any;
        _fn.at = this.api.derive.spotX.totalLiquidityAt as any;

        return _fn;
    }

    get getExchangeAddress(): QueryableExchangeAddressRx {
        return this.api.derive.spotX.exchangeAddress as any;
    }

    /**
     * Query the core asset idit
     */
    get getCoreAssetId(): QueryableStorageFunction<Observable<AssetId>, {}> {
        return this.api.query.cennzX.coreAssetId as any;
    }

    /**
     * Query the core asset idit
     */
    get getFeeRate(): QueryableStorageFunction<Observable<AssetId>, {}> {
        return this.api.query.cennzX.feeRate as any;
    }

    // tslint:disable:member-ordering
    /**
     * Query liquidity balance for an account
     * @param {(AnyNumber,AnyNumber)} coreAssetIs, assetId The id of the asset
     * @param {AnyAddress} address The address of the account
     */
    get getLiquidityBalance(): QueryableGetLiquidityBalanceRx {
        const _fn = this.api.derive.spotX.liquidityBalance as any;
        _fn.at = this.api.derive.spotX.liquidityBalanceAt as any;

        return _fn;
    }
}
