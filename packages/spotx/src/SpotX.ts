import SubmittableExtrinsic from '@polkadot/api/SubmittableExtrinsic';
import {QueryableStorageFunction} from '@polkadot/api/types';
import {AccountId, Balance, Data, Hash, Option, Tuple, typeRegistry} from '@polkadot/types';
import {AnyNumber, Codec} from '@polkadot/types/types';
import BN from 'bn.js';
import {Api} from 'cennznet-api';
import {AnyAddress, QueryableGenerateExchangeAddress, QueryableGetLiquidityBalance} from './types';
import {generateStorageDoubleMapKey} from './utils/utils';
// (core_asset_id, asset_id)
//pub type ExchangeKey<T> = (<T as generic_asset::Trait>::AssetId, <T as generic_asset::Trait>::AssetId);

export class SpotX {
    private _api: Api;

    constructor(api: Api) {
        this._api = api;
    }

    get api(): Api {
        return this._api;
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
                  ): SubmittableExtrinsic<Promise<Codec>, Promise<() => any>> {
        return this.api.tx.cennzX.addLiquidity(assetId, minLiquidity, maxAssetAmount, coreAmount);
    }

    /**
     * Asset to core swap output
     * @param {AnyNumber} assetId The id of the transferred asset
     * @param {AnyAddress} dest The address of the destination account
     * @param {AnyNumber} amount The amount to be transferred
     */
    assetToCoreSwapOutput(
        assetId: AnyNumber,
        amount_bought: AnyNumber,
        max_amount_sold: AnyNumber
    ): SubmittableExtrinsic<Promise<Codec>, Promise<() => any>> {
        return this.api.tx.cennzX.asset_to_core_swap_output(assetId, amount_bought, max_amount_sold);
    }


    /**
     * Asset to core swap output
     * @param {AnyNumber} assetId The id of the transferred asset
     * @param {AnyAddress} dest The address of the destination account
     * @param {AnyNumber} amount The amount to be transferred
     */
    coreToAssetSwapOutput(
        assetId: AnyNumber,
        amount_bought: AnyNumber,
        max_amount_sold: AnyNumber
    ): SubmittableExtrinsic<Promise<Codec>, Promise<() => any>> {
        return this.api.tx.cennzX.coreToAssetSwapOutput(assetId, amount_bought, max_amount_sold);
    }

    /**
     * Query the total liquidity of an exchange pool
     */
    get getTotalLiquidityOfExchangePool(): QueryableStorageFunction<Promise<Codec>, Promise<() => any>> {
        return this.api.query.cennzX.totalSupply;
    }

    /**
     * Query the core asset idit
     */
    get getCoreAssetId(): QueryableStorageFunction<Promise<Codec>, Promise<() => any>> {
        return this.api.query.cennzX.coreAssetId;
    }

    // tslint:disable:member-ordering
    /**
     * Query liquidity balance for an account
     * @param {(AnyNumber,AnyNumber)} coreAssetIs, assetId The id of the asset
     * @param {AnyAddress} address The address of the account
     */
    getLiquidityBalance: QueryableGetLiquidityBalance = (() => {
        const _fn: any = async (assetId: AnyNumber, address: AnyAddress, cb?: any): Promise<BN | (() => any)> => {
            const coreAssetId = await this.getCoreAssetId();
            const AssetId = typeRegistry.get('AssetId');
            const exchangeKey = new Tuple([AssetId, AssetId], [coreAssetId, assetId]);
            const key: string = generateStorageDoubleMapKey('cennz-x-spot:liquidity', exchangeKey, address);
            if (cb) {
                return this.api.rpc.state.subscribeStorage([key], (...args: Array<any>) => {
                    const balance = new Balance(args[0][0].unwrapOr(undefined));
                    cb(balance);
                });
            }
            const balanceOptional = ((await this.api.rpc.state.getStorage(key)) as unknown) as Option<Data>;

            return new Balance(balanceOptional.unwrapOr(undefined));
        };
        _fn.at = async (assetId: AnyNumber, address: AnyAddress, hash: Hash): Promise<BN> => {
            const coreAssetId = await this.getCoreAssetId();
            const key: string = generateStorageDoubleMapKey('ga:free:', [coreAssetId, assetId], address);

            const balanceOptional = ((await this.api.rpc.state.getStorage(key, hash)) as unknown) as Option<Data>;

            return new Balance(balanceOptional.unwrapOr(undefined));
        };

        return _fn;
    })();

}
