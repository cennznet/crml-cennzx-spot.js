import SubmittableExtrinsic from '@polkadot/api/SubmittableExtrinsic';
import {QueryableStorageFunction} from '@polkadot/api/types';
import {Address, Balance, Data, Hash, Option, Permill, Tuple, u128} from '@polkadot/types';
import {AnyNumber, Codec} from '@polkadot/types/types';
import BN from 'bn.js';
import {Api} from 'cennznet-api';
import {GenericAsset} from 'cennznet-generic-asset';
import {AssetId} from 'cennznet-runtime-types';
import {AnyAddress, QueryableGetLiquidityBalance} from './types';
import {generateExchangeAddress, generateStorageDoubleMapKey} from './utils/utils';

const PERMILL_BASE = 1000000;

export class SpotX {
    private _api: Api;
    private _ga: GenericAsset;

    constructor(api: Api) {
        this._api = api;
        this._ga = new GenericAsset(api);
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

    async getAssetToCoreOutputPrice(
        assetId: AnyNumber,
        amountBought: AnyNumber,
    ): Promise<BN> {
        const [exchangeAddress, coreAssetId, feeRate] = [
            await this.getExchangeAddress(assetId),
            await this.getCoreAssetId(),
            await this.getFeeRate() as Permill
        ];
        const [tradeAssetReserve, coreAssetReserve] = [
            await this.ga.getFreeBalance(assetId, exchangeAddress) as BN,
            await this.ga.getFreeBalance(coreAssetId, exchangeAddress) as BN,
        ];
        return this.getOutputPrice(new u128(amountBought), tradeAssetReserve, coreAssetReserve, feeRate);
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
    ): SubmittableExtrinsic<Promise<Codec>, Promise<() => any>> {
        return this.api.tx.cennzX.assetToCoreSwapOutput(assetId, amountBought, maxAmountSold);
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
    // TODO: change into derieved query
    async getTotalLiquidity(assetId: AssetId | AnyNumber): Promise<BN> {
        const coreAssetId = await this.getCoreAssetId();
        const exchangeKey = this.getExchangeKey(coreAssetId, assetId);
        return (this.api.query.cennzX.totalSupply(exchangeKey) as unknown) as BN;
    }

    async getExchangeAddress(assetId: AssetId | AnyNumber): Promise<string> {
        const coreAssetId = await this.getCoreAssetId();
        return generateExchangeAddress(coreAssetId, assetId);
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
    getLiquidityBalance: QueryableGetLiquidityBalance = (() => {
        const _fn: any = async (assetId: AnyNumber, address: AnyAddress, cb?: any): Promise<BN | (() => any)> => {
            const coreAssetId = await this.getCoreAssetId();
            // const AssetId = typeRegistry.get('AssetId');
            // TODO: const Address = typeRegistry.get('Address');
            const exchangeKey = this.getExchangeKey(coreAssetId, assetId);
            const key: string = generateStorageDoubleMapKey(
                'cennz-x-spot:liquidity',
                exchangeKey,
                new Address(address)
            );
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
            // const AssetId = typeRegistry.get('AssetId');
            // const Address = typeRegistry.get('Address');
            const exchangeKey = this.getExchangeKey(coreAssetId, assetId);
            const key: string = generateStorageDoubleMapKey('ga:free:', exchangeKey, new Address(address));

            const balanceOptional = ((await this.api.rpc.state.getStorage(key, hash)) as unknown) as Option<Data>;

            return new Balance(balanceOptional.unwrapOr(undefined));
        };

        return _fn;
    })();

    private getExchangeKey(coreAssetId: AssetId | AnyNumber, assetId: AssetId | AnyNumber): Codec {
        return new Tuple([AssetId, AssetId], [coreAssetId, assetId]);
    }

    private getOutputPrice(outputAmount: BN, inputReserve: BN, outputReserve: BN, feeRate: Permill): BN {
        if (inputReserve.isZero() || outputReserve.isZero()){
            return new BN(0);
        }
        const output = inputReserve.mul(outputAmount).div(outputReserve.sub(outputAmount)).addn(1);
        return feeRate.mul(output).divn(PERMILL_BASE).add(output);
    }
}
