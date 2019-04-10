export {assetToCoreOutputPrice, assetToCoreOutputPriceAt} from './assetToCoreOutputPrice';
export {coreToAssetOutputPrice, coreToAssetOutputPriceAt} from './coreToAssetOutputPrice';
export {liquidityBalance, liquidityBalanceAt} from './liquidityBalance';
export {totalLiquidity, totalLiquidityAt} from './totalLiquidity';
export {exchangeAddress} from './exchangeAddress';

export function getSpotXQuery(api): any {
    // TODO: This code can be removed once the rename (cennzX ~ cennzxSpot) is applied on all blockchain networks.
    return api.query.cennzX ? api.query.cennzX : api.query.cennzxSpot;
}
