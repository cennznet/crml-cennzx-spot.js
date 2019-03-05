/**
 * Get more fund from https://cennznet-faucet-ui.centrality.me/ if the sender account does not have enough fund
 */
import {Event, EventRecord, Tuple, typeRegistry, Vector} from '@polkadot/types';
import {stringToU8a} from '@polkadot/util';
import {Api} from 'cennznet-api';
import {SimpleKeyring, Wallet} from 'cennznet-wallet';
import {GenericAsset} from 'cennznet-generic-asset';
import WsProvider from '@polkadot/rpc-provider/ws';
import {Null} from '@polkadot/types/index.types';
import BN from 'bn.js';
import {SpotX} from '../src/SpotX';

const assetOwner = {
    address: '5GoKvZWG5ZPYL1WUovuHW3zJBWBP5eT8CbqjdRY4Q6iMaDtZ',
    seed: stringToU8a(('Alice' as any).padEnd(32, ' '))
};

const trader = {
    address: '5Gw3s7q4QLkSWwknsiPtjujPv3XM4Trxi5d4PgKMMk3gfGTE',
    seed: stringToU8a(('Bob' as any).padEnd(32, ' '))
};

const passphrase = 'passphrase';
// const url = 'wss://cennznet-node-0.centrality.me:9944';
const url = undefined;

const types = {
    PermissionOptions: Null
}

const coreAssetId = 10;
const tradeAssetId = 0;
const testAsset = {
    id: 1
    // ownerAccount: '5FPCjwLUkeg48EDYcW5i4b45HLzmCn4aUbx5rsCsdtPbTsKT',
    //totalSupply: 10000000000
}

describe('SpotX APIs', () => {
    let api: Api;
    let spotX: SpotX;
    let ga: GenericAsset;
    beforeAll(async () => {
        const websocket = new WsProvider(url);
        api = await Api.create({provider: websocket, types});
        const simpleKeyring: SimpleKeyring = new SimpleKeyring();
        simpleKeyring.addFromSeed(assetOwner.seed);
        simpleKeyring.addFromSeed(trader.seed);
        const wallet = new Wallet();
        await wallet.createNewVault(passphrase);
        await wallet.addKeyring(simpleKeyring);
        api.setSigner(wallet);
        spotX = new SpotX(api);
        ga = new GenericAsset(api);
        console.log(spotX);
    })

    afterAll(async () => {
        ((api as any)._rpc._provider as any).websocket.onclose = null;
        ((api as any)._rpc._provider as any).websocket.close();
    })
    describe('Add to pool()', () => {
        it('Deposit core asset and trade asset at current ratio to mint exchange tokens and return \'AddLiquidity\' event once successful', async (done) => {
            const totalAmount: number = 1000;
            const assetId = 0;
            expect(((await ga.getFreeBalance(0, assetOwner.address)) as BN).gtn(1000)).toBeTruthy();
            expect(((await ga.getFreeBalance(10, assetOwner.address)) as BN).gtn(1000)).toBeTruthy();
            await spotX.addLiquidity(assetId, 2, 1000, 1000, 10).signAndSend(assetOwner.address, async (status) => {
                if (status.type === 'Finalised' && status.events !== undefined) {
                    let isCreated = false;
                    for(let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'AddLiquidity') {
                            isCreated = true;
                            // TODO: expect(event.event.data[0]).equal(assetId);
                            // query balance
                            // const coreAssetId: any = await spotX.getCoreAssetId();
                            const balance = await spotX.getLiquidityBalance(assetId, assetOwner.address);
                            expect(balance.toString(10)).toEqual(totalAmount.toString(10))
                        }
                    }
                    // return isCreated event
                    expect(isCreated).toEqual(true);
                    done();
                }
            });
        });
        it('query', async (done) => {
            const totalAmount: number = 1000;
            const assetId = 0;
            const balance = await spotX.getLiquidityBalance(assetId, assetOwner.address);
            const coreAssetId = await spotX.getCoreAssetId();
            const AssetId = typeRegistry.get('AssetId');
            typeRegistry.register({ExchangeKey: Tuple.with([AssetId, AssetId])});

            const exchangeKey = new Tuple([AssetId, AssetId], [coreAssetId, assetId]);
            const exchangeAddress = await spotX.getExchangeAddress(assetId);
            const total = await spotX.getTotalLiquidity(assetId);
            // expect(balance.toString(10)).toEqual(totalAmount.toString(10))
            const coreBalance = await ga.getFreeBalance(coreAssetId.toString(), exchangeAddress);
            const assetBalance = await ga.getFreeBalance(assetId, exchangeAddress);
            const feeRate = await spotX.getFeeRate();
            const expectPay = await spotX.getAssetToCoreOutputPrice(tradeAssetId, 50);

            console.log();

        })
    })
    it('can transfer ', async (done) => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
        const coreAssetBalanceBefore = await ga.getFreeBalance(coreAssetId, trader.address) as BN;
        console.log(spotX)
        await ga.transfer(tradeAssetId, assetOwner.address, amountBought).signAndSend(trader.address, async (status) => {
            if (status.type === 'Finalised') {
                const tradeAssetBalanceAfter = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
                const coreAssetBalanceAfter = await ga.getFreeBalance(coreAssetId, trader.address) as BN;
                const gas = coreAssetBalanceBefore.sub(coreAssetBalanceAfter);
                const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                const blockHash = status.status.asFinalised;
                const events = await api.query.system.events.at(blockHash);
                done();
            }
        });

    });
    it('can Trade ', async (done) => {
        const amountBought = 1000;
        const tradeAssetBalanceBefore = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
        const coreAssetBalanceBefore = await ga.getFreeBalance(coreAssetId, trader.address) as BN;
        const expectPay = await spotX.getAssetToCoreOutputPrice(tradeAssetId, amountBought);
        console.log(expectPay);
        await spotX.assetToCoreSwapOutput(tradeAssetId, amountBought, 50000).signAndSend(trader.address, async (status) => {
            if (status.type === 'Finalised') {
                const tradeAssetBalanceAfter = await ga.getFreeBalance(tradeAssetId, trader.address) as BN;
                const coreAssetBalanceAfter = await ga.getFreeBalance(coreAssetId, trader.address) as BN;
                const gain = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                const blockHash = status.status.asFinalised;
                const events = await api.query.system.events.at(blockHash) as Vector<EventRecord>;
                const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                const gas = feeChargeEvent.event.data[1];
                console.log(expectPay, );
                done();
            }
        });

    });
//CoreAssetPurchase
    /*assert_ok!(CennzXSpot::add_liquidity(
				Origin::signed(H256::from_low_u64_be(1)),
				1, //asset_id: T::AssetId,
				2, // min_liquidity: T::Balance,
				1000, //max_asset_amount: T::Balance,
				1000, //core_amount: T::Balance,
				10,//expire: T::Moment
			));
			let exchange_key = (0, 1);
			let pool_address = CennzXSpot::generate_exchange_address(&exchange_key);

			assert_eq!(<generic_asset::Module<Test>>::free_balance(&0, &pool_address), 1000);
			assert_eq!(<generic_asset::Module<Test>>::free_balance(&1, &pool_address), 1000);

			assert_eq!(CennzXSpot::get_liquidity(&exchange_key, &H256::from_low_u64_be(1)), 1000);
			assert_eq!(CennzXSpot::get_asset_to_core_output_price(1,123,return_fee_rate),136);
			assert_ok!(CennzXSpot::asset_to_core_swap_output(
				Origin::signed(H256::from_low_u64_be(1)), //origin
				1, // asset_id: T::AssetId,
				123, // amount_bought: T::Balance,
				140, // max_amount_sold: T::Balance,
			));
			assert_eq!(<generic_asset::Module<Test>>::free_balance(&0, &pool_address), 877);
			assert_eq!(<generic_asset::Module<Test>>::free_balance(&1, &H256::from_low_u64_be(1)), 364);
			assert_eq!(<generic_asset::Module<Test>>::free_balance(&1, &pool_address), 1136);*/
    // describe('Puchase core asset from trade asset()', () => {
    //     it('Puchase core asset from trade asset for target account', async (done) => {
    //         await spotX.addLiquidity(1, 2, 1000, 1000, 10).signAndSend(assetOwner.address, async (status) => {
    //             if (status.type === 'Finalised' && status.events !== undefined) {
    //                 if (event.event.method === 'AddLiquidity') {
    //                     await spotX.assetToCoreSwapOutput(1, 123, 140).signAndSend(assetOwner.address, async (status) => {
    //                         if (status.type === 'Finalised' && status.events !== undefined) {
    //                             const coreAssetId: any = await spotX.getCoreAssetId();
    //                             const transferAmount: any = 364;
    //                             await spotX.getLiquidityBalance([coreAssetId, testAsset.id],assetOwner.address)
    //                             const balanceAfter: BN = await ga.getFreeBalance(testAsset.id, assetOwner.address) as BN;
    //                             expect(balanceAfter.toString(10)).toEqual(transferAmount.toString());
    //                             done();
    //                         }
    //                     });
    //                 }
    //             }
    //         });
    //     })
    // })
    //
    // describe('queryLiquidityBalance()', () => {
    //     it('queries free balance', async () => {
    //         const coreAssetId: any = await spotX.getCoreAssetId();
    //         const balance: BN = await spotX.getLiquidityBalance([coreAssetId, testAsset.id], assetOwner.address) as BN;
    //         expect(balance).toBeDefined;
    //     })
    // })


})
