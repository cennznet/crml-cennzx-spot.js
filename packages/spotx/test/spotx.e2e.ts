/**
 * Get more fund from https://cennznet-faucet-ui.centrality.me/ if the sender account does not have enough fund
 */
import {EventRecord, getTypeRegistry, Vector} from '@cennznet/types/polkadot';
import {stringToU8a} from '@cennznet/util';
import {Api} from '@cennznet/api';
import {SimpleKeyring, Wallet} from '@cennznet/wallet';
import {GenericAsset} from '@cennznet/generic-asset';
import {WsProvider} from '@cennznet/api/polkadot';
import BN from 'bn.js';
import {SpotX} from '../src/SpotX';

const investor = {
    address: '5H6dGC3TbdyKFagoCEXGaNtsovTtpYYtMTXnsbtVYcn2T1VY',
    seed: stringToU8a(('cennznet-js-test' as any).padEnd(32, ' ')),
};

// const investorForLocal = {
//     address: '5Gw3s7q4QLkSWwknsiPtjujPv3XM4Trxi5d4PgKMMk3gfGTE',
//     seed: stringToU8a('Bob'.padEnd(32, ' '))
// }

const trader = investor;

const recipient = {
    address: '5FPCjwLUkeg48EDYcW5i4b45HLzmCn4aUbx5rsCsdtPbTsKT',
    seed: stringToU8a(('cennznetjstest' as any).padEnd(32, ' ')),
};

const passphrase = '';
const url = 'wss://cennznet-node-0.centrality.me:9944';
//const url = undefined;

const coreAssetId = 16001;
const tradeAssetA = 16000;
const tradeAssetB = 101;

describe('SpotX APIs', () => {
    let api: Api;
    let cennzxSpot: SpotX;
    let ga: GenericAsset;
    beforeAll(async () => {
        const websocket = new WsProvider(url);
        api = await Api.create({provider: websocket});
        const simpleKeyring: SimpleKeyring = new SimpleKeyring();
        simpleKeyring.addFromSeed(investor.seed);
        const wallet = new Wallet();
        await wallet.addKeyring(simpleKeyring);
        api.setSigner(wallet);
        cennzxSpot = await SpotX.create(api);
        ga = cennzxSpot.ga;
    });

    afterAll(async () => {
        ((api as any)._rpc._provider as any).websocket.onclose = null;
        ((api as any)._rpc._provider as any).websocket.close();
    });
    describe('Liquidity Operations', () => {
        it("Add liquidity and receive 'AddLiquidity' event", async done => {
            /**************************************************************/
            /*** Prepare test data to ensure balance *********************/
            /************************************************************/

            const investAmount: number = 800;
            const maxAssetAmount = '800';
            expect((await ga.getFreeBalance(tradeAssetA, investor.address)).gtn(1000)).toBeTruthy();
            expect((await ga.getFreeBalance(coreAssetId, investor.address)).gtn(1000)).toBeTruthy();
            await cennzxSpot
                .addLiquidity(tradeAssetA, 0, maxAssetAmount, investAmount)
                .signAndSend(investor.address, async status => {
                    if (status.type === 'Finalised' && status.events !== undefined) {
                        let isCreated = false;
                        for (let i = 0; i < status.events.length; i += 1) {
                            const event = status.events[i];
                            if (event.event.method === 'AddLiquidity') {
                                isCreated = true;
                                const [account, coreInvestAmount, assetId, targetInvestAmount] = event.event.data;
                                expect(account.toString()).toEqual(investor.address);
                                expect(((assetId as unknown) as BN).toNumber()).toEqual(tradeAssetA);
                                expect(((coreInvestAmount as unknown) as BN).toNumber()).toEqual(investAmount);
                                expect(
                                    ((targetInvestAmount as unknown) as BN).lte(new BN(maxAssetAmount))
                                ).toBeTruthy();
                                const liquidity = await cennzxSpot.getLiquidityBalance(tradeAssetA, investor.address);
                                expect(liquidity.gtn(0)).toBeTruthy();
                            }
                        }
                        // return isCreated event
                        expect(isCreated).toEqual(true);
                        done();
                    }
                });
        });

        it("Add liquidity for second asset and receive 'AddLiquidity' event", async done => {
            /**************************************************************/
            /*** Prepare test data to ensure balance *********************/
            /************************************************************/

            const investAmount: number = 800;
            const maxAssetAmount = '800';
            expect((await ga.getFreeBalance(coreAssetId, investor.address)).gtn(1000)).toBeTruthy();
            expect((await ga.getFreeBalance(tradeAssetB, investor.address)).gtn(1000)).toBeTruthy();
            await cennzxSpot
                .addLiquidity(tradeAssetB, 0, maxAssetAmount, investAmount)
                .signAndSend(investor.address, async status => {
                    if (status.type === 'Finalised' && status.events !== undefined) {
                        let isCreated = false;
                        for (let i = 0; i < status.events.length; i += 1) {
                            const event = status.events[i];
                            if (event.event.method === 'AddLiquidity') {
                                isCreated = true;
                                const [account, coreInvestAmount, assetId, targetInvestAmount] = event.event.data;
                                expect(account.toString()).toEqual(investor.address);
                                expect(((assetId as unknown) as BN).toNumber()).toEqual(tradeAssetB);
                                expect(((coreInvestAmount as unknown) as BN).toNumber()).toEqual(investAmount);
                                expect(
                                    ((targetInvestAmount as unknown) as BN).lte(new BN(maxAssetAmount))
                                ).toBeTruthy();
                                const liquidity = await cennzxSpot.getLiquidityBalance(tradeAssetB, investor.address);
                                expect(liquidity.gtn(0)).toBeTruthy();
                            }
                        }
                        // return isCreated event
                        expect(isCreated).toEqual(true);
                        done();
                    }
                });
        });

        it("Remove liquidity and receive 'RemoveLiquidity' event", async done => {
            const liquidity = await cennzxSpot.getLiquidityBalance(tradeAssetA, investor.address);
            await cennzxSpot.removeLiquidity(tradeAssetA, liquidity, 1, 1).signAndSend(investor.address, async status => {
                if (status.type === 'Finalised' && status.events !== undefined) {
                    let isRemoved = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'RemoveLiquidity') {
                            isRemoved = true;
                            const balance = await cennzxSpot.getLiquidityBalance(tradeAssetA, investor.address);
                            expect(balance.eqn(0)).toBeTruthy();
                            // TODO: check balance change of exchange account
                        }
                    }
                    // return isCreated event
                    expect(isRemoved).toEqual(true);
                    done();
                }
            });
        });
        it.skip('query', async done => {
            const typeRegistry = getTypeRegistry();
            const totalAmount: number = 200;
            const balance = await cennzxSpot.getLiquidityBalance(tradeAssetA, investor.address);
            const coreAssetId = await cennzxSpot.getCoreAssetId();
            const exchangeAddress = await cennzxSpot.getExchangeAddress(tradeAssetA);
            console.log('Exchange address:' + exchangeAddress);
            const total = await cennzxSpot.getTotalLiquidity(tradeAssetA);
            const coreBalance = await ga.getFreeBalance(coreAssetId, exchangeAddress);
            console.log('Core bal ' + coreBalance);
            const assetBalance = await ga.getFreeBalance(tradeAssetA, exchangeAddress);
            console.log('Trade bal ' + assetBalance);
            const feeRate = await cennzxSpot.getFeeRate();
            const expectPay = await cennzxSpot.getAssetToCoreOutputPrice(tradeAssetA, 50);
            done();
        });
    });
    it('can transfer ', async done => {
        const amountBought = 200;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
        await ga.transfer(tradeAssetA, investor.address, amountBought).signAndSend(trader.address, async status => {
            if (status.type === 'Finalised') {
                const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                const gas = coreAssetBalanceBefore.sub(coreAssetBalanceAfter);
                const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                const blockHash = status.status.asFinalised;
                const events = await api.query.system.events.at(blockHash);
                console.log('Events:' + events);

                done();
            }
        });
    });
    it('can trade from asset to core for exact core asset amount', async done => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
        const expectPay = await cennzxSpot.getAssetToCoreOutputPrice(tradeAssetA, amountBought);
        console.log(expectPay);
        await cennzxSpot
            .assetToCoreSwapOutput(tradeAssetA, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'CoreAssetPurchase') { // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                            const gain = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                            const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                            const blockHash = status.status.asFinalised;
                            const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                            const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                            const gas = feeChargeEvent.event.data[1];
                            console.log(expectPay);
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });
    it('can trade from core to asset for exact trade asset amount', async done => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
        await cennzxSpot
            .coreToAssetSwapOutput(tradeAssetA, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'TradeAssetPurchase') { // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                            const pay = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                            const gain = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                            const blockHash = status.status.asFinalised;
                            const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                            const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                            const gas = feeChargeEvent.event.data[1];
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });

    it('can trade from core to asset for exact core asset amount', async done => {
        const sellAmount = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
        await cennzxSpot
            .coreToAssetSwapInput(tradeAssetA, sellAmount, 30)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'TradeAssetPurchase') { // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                            const pay = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                            const gain = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                            const blockHash = status.status.asFinalised;
                            const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                            const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                            const gas = feeChargeEvent.event.data[1];
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });

    it('Get core asset from seller and transfer trade asset to recipient for exact trade asset amount', async done => {
        const sellAmount = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetA, recipient.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
        await cennzxSpot
            .coreToAssetTransferInput(recipient.address, tradeAssetA, sellAmount, 30)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'TradeAssetPurchase') { // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, recipient.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                            const pay = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                            const gain = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                            const blockHash = status.status.asFinalised;
                            const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                            const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                            const gas = feeChargeEvent.event.data[1];
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });

    it('can trade from asset to core for exact trade asset amount', async done => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
        const expectPay = await cennzxSpot.getAssetToCoreOutputPrice(tradeAssetA, amountBought);
        console.log(expectPay);
        await cennzxSpot
            .assetToCoreSwapInput(tradeAssetA, amountBought, 30)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'CoreAssetPurchase') { // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                            const gain = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                            const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                            const blockHash = status.status.asFinalised;
                            const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                            const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                            const gas = feeChargeEvent.event.data[1];
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });

    it('Get trade asset from seller and transfer core asset to recipient for exact trade asset amount', async done => {
        const sellAmount = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, recipient.address)) as BN;
        await cennzxSpot
            .assetToCoreTransferInput(recipient.address, tradeAssetA, sellAmount, 30)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'CoreAssetPurchase') { // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, recipient.address)) as BN;

                            const pay = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                            const gain = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                            const blockHash = status.status.asFinalised;
                            const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                            const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                            const gas = feeChargeEvent.event.data[1];
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });

    it('Get trade asset from buyer and transfer core asset to recipient for exact core asset amount', async done => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, recipient.address)) as BN;
        await cennzxSpot
            .assetToCoreTransferOutput(recipient.address, tradeAssetA, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'CoreAssetPurchase') { // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, recipient.address)) as BN;
                            const gain = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                            const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                            const blockHash = status.status.asFinalised;
                            const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                            const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                            const gas = feeChargeEvent.event.data[1];
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });

    it('Get core asset from buyer and transfer trade asset to recipient for exact trade asset amount', async done => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, recipient.address)) as BN;
        await cennzxSpot
            .coreToAssetTransferOutput(recipient.address, tradeAssetA, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'TradeAssetPurchase') { // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, recipient.address)) as BN;
                            const gain = coreAssetBalanceAfter.sub(coreAssetBalanceBefore);
                            const pay = tradeAssetBalanceBefore.sub(tradeAssetBalanceAfter);
                            const blockHash = status.status.asFinalised;
                            const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                            const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                            const gas = feeChargeEvent.event.data[1];
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });

    it('can trade from asset "A" to asset "B" with exact asset B amount and max A amount', async done => {
        const amountBought = 50;
        const tradeAssetABalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const tradeAssetBBalanceBefore = (await ga.getFreeBalance(tradeAssetB, trader.address)) as BN;
        await cennzxSpot
            .assetToAssetSwapOutput(tradeAssetA, tradeAssetB, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'AssetToAssetPurchase') { // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetABalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const tradeAssetBBalanceAfter = (await ga.getFreeBalance(tradeAssetB, trader.address)) as BN;
                            const gain = tradeAssetBBalanceBefore.sub(tradeAssetBBalanceAfter);
                            const pay = tradeAssetABalanceBefore.sub(tradeAssetABalanceAfter);
                            const blockHash = status.status.asFinalised;
                            const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                            const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                            const gas = feeChargeEvent.event.data[1];
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });

    it('can trade from asset "A" to asset "B" with exact asset B amount and max A amount and transfer asset "B" to recipient', async done => {
        const amountBought = 50;
        const tradeAssetABalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const tradeAssetBBalanceBefore = (await ga.getFreeBalance(tradeAssetB, trader.address)) as BN;
        await cennzxSpot
            .assetToAssetTransferOutput(recipient.address, tradeAssetA, tradeAssetB, amountBought, 50000)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'AssetToAssetPurchase') { // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetABalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const tradeAssetBBalanceAfter = (await ga.getFreeBalance(tradeAssetB, trader.address)) as BN;
                            const gain = tradeAssetBBalanceBefore.sub(tradeAssetBBalanceAfter);
                            const pay = tradeAssetABalanceBefore.sub(tradeAssetABalanceAfter);
                            const blockHash = status.status.asFinalised;
                            const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                            const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                            const gas = feeChargeEvent.event.data[1];
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });

    it('can trade from asset "A" to asset "B" with exact asset A amount and min B amount', async done => {
        const sellAmount = 50;
        const tradeAssetABalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const tradeAssetBBalanceBefore = (await ga.getFreeBalance(tradeAssetB, trader.address)) as BN;
        await cennzxSpot
            .assetToAssetSwapInput(tradeAssetA, tradeAssetB, sellAmount, 10)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'AssetToAssetPurchase') { //ExtrinsicFailed
                            trade = true;
                            const tradeAssetABalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const tradeAssetBBalanceAfter = (await ga.getFreeBalance(tradeAssetB, trader.address)) as BN;
                            const gain = tradeAssetBBalanceBefore.sub(tradeAssetBBalanceAfter);
                            const pay = tradeAssetABalanceBefore.sub(tradeAssetABalanceAfter);
                            const blockHash = status.status.asFinalised;
                            const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                            const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                            const gas = feeChargeEvent.event.data[1];
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });

    it('can trade from asset "A" to asset "B" with exact asset A amount and min B amount and transfer asset "B" to recipient', async done => {
        const sellAmount = 50;
        const tradeAssetABalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const tradeAssetBBalanceBefore = (await ga.getFreeBalance(tradeAssetB, trader.address)) as BN;
        await cennzxSpot
            .assetToAssetTransferInput(recipient.address, tradeAssetA, tradeAssetB, sellAmount, 10)
            .signAndSend(trader.address, async status => {
                if (status.type === 'Finalised') {
                    let trade = false;
                    for (let i = 0; i < status.events.length; i += 1) {
                        const event = status.events[i];
                        if (event.event.method === 'AssetToAssetPurchase') { //ExtrinsicFailed
                            trade = true;
                            const tradeAssetABalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const tradeAssetBBalanceAfter = (await ga.getFreeBalance(tradeAssetB, trader.address)) as BN;
                            const gain = tradeAssetBBalanceBefore.sub(tradeAssetBBalanceAfter);
                            const pay = tradeAssetABalanceBefore.sub(tradeAssetABalanceAfter);
                            const blockHash = status.status.asFinalised;
                            const events = (await api.query.system.events.at(blockHash)) as Vector<EventRecord>;
                            const feeChargeEvent = events.find(event => event.event.data.method === 'Charged');
                            const gas = feeChargeEvent.event.data[1];
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });
});