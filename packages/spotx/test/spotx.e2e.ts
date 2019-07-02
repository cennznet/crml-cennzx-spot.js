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

/**
 * Get more fund from https://cennznet-faucet-ui.centrality.me/ if the sender account does not have enough fund
 */
import {Api} from '@cennznet/api';
import {SimpleKeyring, Wallet} from '@cennznet/wallet';
import {SubmittableResult} from '@cennznet/api/polkadot';
import {GenericAsset} from '@cennznet/crml-generic-asset';
import BN from 'bn.js';
import {CennzxSpot} from '../src/CennzxSpot';

const investor = {
    address: '5DXUeE5N5LtkW97F2PzqYPyqNkxqSWESdGSPTX6AvkUAhwKP',
    uri: '//cennznet-js-test',
};

const investorOnLocal = {
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    uri: '//Bob',
};

const trader = investor;

const recipient = {
    //addressOnLocal: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
    address: '5ESNjjzmZnnCdrrpUo9TBKhDV1sakTjkspw2ZGg84LAK1e1Y',
};

const passphrase = '';

const coreAssetId = 16001;
const tradeAssetA = 16000;
const tradeAssetB = 16002;

describe('SpotX APIs', () => {
    let api: Api;
    let cennzxSpot: CennzxSpot;
    let ga: GenericAsset;
    beforeAll(async () => {
        api = await Api.create({provider: 'wss://rimu.unfrastructure.io/public/ws'});
        const simpleKeyring: SimpleKeyring = new SimpleKeyring();
        simpleKeyring.addFromUri(investor.uri);
        const wallet = new Wallet();
        await wallet.createNewVault(passphrase);
        await wallet.addKeyring(simpleKeyring);
        api.setSigner(wallet);
        cennzxSpot = await CennzxSpot.create(api);
        ga = cennzxSpot.ga;
    });

    afterAll(async () => {
        api.disconnect();
    });
    describe('Liquidity Operations', () => {
        it("Add liquidity and receive 'AddLiquidity' event", async done => {
            /**************************************************************/
            /*** Prepare test data to ensure balance *********************/
            /************************************************************/

            const investAmount: number = 200000;
            const maxAssetAmount = '100000';
            expect((await ga.getFreeBalance(tradeAssetA, investor.address)).gtn(1000)).toBeTruthy();
            expect((await ga.getFreeBalance(coreAssetId, investor.address)).gtn(1000)).toBeTruthy();
            await cennzxSpot
                .addLiquidity(tradeAssetA, 0, maxAssetAmount, investAmount)
                .signAndSend(investor.address, async ({events, status}: SubmittableResult) => {
                    if (status.isFinalized && events !== undefined) {
                        let isCreated = false;
                        for (let i = 0; i < events.length; i += 1) {
                            const event = events[i];
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

        it('Get Pool trade asset balance and try to get input price', async done => {
            const poolAssetBalance = await cennzxSpot.getPoolAssetBalance(tradeAssetA);
            const poolCoreBalance = await cennzxSpot.getPoolCoreAssetBalance(tradeAssetA);
            // console.log('Balance:'+poolCoreBalance);
            // console.log('Asset Balance:'+poolAssetBalance);
            try {
                const expectedAssetPrice = await cennzxSpot.getInputPrice(coreAssetId, tradeAssetA, poolAssetBalance);
            } catch (e) {
                expect(e).toEqual(new Error('Pool balance is low'));
            }
            done();
        });

        it("Add liquidity for second asset and receive 'AddLiquidity' event", async done => {
            /**************************************************************/
            /*** Prepare test data to ensure balance *********************/
            /************************************************************/

            const investAmount: number = 400601;
            const maxAssetAmount = '50000000000';
            expect((await ga.getFreeBalance(coreAssetId, investor.address)).gtn(1000)).toBeTruthy();
            expect((await ga.getFreeBalance(tradeAssetB, investor.address)).gtn(1000)).toBeTruthy();
            await cennzxSpot
                .addLiquidity(tradeAssetB, 0, maxAssetAmount, investAmount)
                .signAndSend(investor.address, async ({events, status}: SubmittableResult) => {
                    if (status.isFinalized && events !== undefined) {
                        let isCreated = false;
                        for (let i = 0; i < events.length; i += 1) {
                            const event = events[i];
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
    });

    it('can trade from asset to core for exact core asset amount', async done => {
        const amountBought = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
        const expectedCorePrice = await cennzxSpot.getOutputPrice(tradeAssetA, coreAssetId, amountBought);
        await cennzxSpot
            .assetSwapOutput(tradeAssetA, coreAssetId, amountBought, 50000)
            .signAndSend(trader.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetPurchase') {
                            // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                            expect(tradeAssetBalanceAfter).toBeDefined;
                            expect(coreAssetBalanceAfter).toBeDefined;
                            const [assetA, assetB, seller, price, amountBought] = event.event.data;
                            expect(price.eq(expectedCorePrice)).toBeTruthy();
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
        const expectedAssetPrice = await cennzxSpot.getOutputPrice(coreAssetId, tradeAssetA, amountBought);
        await cennzxSpot
            .assetSwapOutput(coreAssetId, tradeAssetA, amountBought, 50000)
            .signAndSend(trader.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetPurchase') {
                            // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                            expect(tradeAssetBalanceAfter).toBeDefined;
                            expect(coreAssetBalanceAfter).toBeDefined;
                            const [assetA, assetB, seller, price, amountBought] = event.event.data;
                            expect(price.eq(expectedAssetPrice)).toBeTruthy();
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
        const expectedAssetPrice = await cennzxSpot.getInputPrice(coreAssetId, tradeAssetA, sellAmount);
        await cennzxSpot
            .assetSwapInput(coreAssetId, tradeAssetA, sellAmount, 10)
            .signAndSend(trader.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetPurchase') {
                            // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                            expect(tradeAssetBalanceAfter).toBeDefined;
                            expect(coreAssetBalanceAfter).toBeDefined;
                            const [assetA, assetB, seller, sellAmount, sellValue] = event.event.data;
                            expect(sellValue.eq(expectedAssetPrice)).toBeTruthy();
                            done();
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
        const expectedPrice = await cennzxSpot.getInputPrice(coreAssetId, tradeAssetA, sellAmount);
        await cennzxSpot
            .assetTransferInput(recipient.address, coreAssetId, tradeAssetA, sellAmount, 10)
            .signAndSend(trader.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetPurchase') {
                            // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(
                                tradeAssetA,
                                recipient.address
                            )) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                            expect(tradeAssetBalanceAfter).toBeDefined;
                            expect(coreAssetBalanceAfter).toBeDefined;
                            const [assetA, assetB, seller, sellAmount, sellValue] = event.event.data;
                            expect(sellValue.eq(expectedPrice)).toBeTruthy();
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });

    it('can trade from asset to core for exact trade asset amount', async done => {
        const sellAmount = 50;
        const tradeAssetBalanceBefore = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
        const coreAssetBalanceBefore = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
        const expectedCorePrice = await cennzxSpot.getInputPrice(tradeAssetA, coreAssetId, sellAmount);
        await cennzxSpot
            .assetSwapInput(tradeAssetA, coreAssetId, sellAmount, 10)
            .signAndSend(trader.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetPurchase') {
                            // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                            expect(tradeAssetBalanceAfter).toBeDefined;
                            expect(coreAssetBalanceAfter).toBeDefined;
                            const [assetA, assetB, seller, sellAmount, sellValue] = event.event.data;
                            expect(sellValue.eq(expectedCorePrice)).toBeTruthy();
                            done();
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
        const expectedPrice = await cennzxSpot.getInputPrice(tradeAssetA, coreAssetId, sellAmount);
        await cennzxSpot
            .assetTransferInput(recipient.address, tradeAssetA, coreAssetId, sellAmount, 20)
            .signAndSend(trader.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetPurchase') {
                            // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(
                                coreAssetId,
                                recipient.address
                            )) as BN;
                            expect(tradeAssetBalanceAfter).toBeDefined;
                            expect(coreAssetBalanceAfter).toBeDefined;
                            const [assetA, assetB, seller, sellAmount, sellValue] = event.event.data;
                            expect(sellValue.eq(expectedPrice)).toBeTruthy();
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
        const expectedPrice = await cennzxSpot.getOutputPrice(tradeAssetA, coreAssetId, amountBought);
        await cennzxSpot
            .assetTransferOutput(recipient.address, tradeAssetA, coreAssetId, amountBought, 50000)
            .signAndSend(trader.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetPurchase') {
                            // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(tradeAssetA, trader.address)) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(
                                coreAssetId,
                                recipient.address
                            )) as BN;
                            expect(tradeAssetBalanceAfter).toBeDefined;
                            expect(coreAssetBalanceAfter).toBeDefined;
                            const [assetA, assetB, seller, price, amountBought] = event.event.data;
                            expect(price.eq(expectedPrice)).toBeTruthy();
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
        const expectedPrice = await cennzxSpot.getOutputPrice(coreAssetId, tradeAssetA, amountBought);
        await cennzxSpot
            .assetTransferOutput(recipient.address, coreAssetId, tradeAssetA, amountBought, 50000)
            .signAndSend(trader.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetPurchase') {
                            // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetBalanceAfter = (await ga.getFreeBalance(
                                tradeAssetA,
                                recipient.address
                            )) as BN;
                            const coreAssetBalanceAfter = (await ga.getFreeBalance(coreAssetId, trader.address)) as BN;
                            expect(tradeAssetBalanceAfter).toBeDefined;
                            expect(coreAssetBalanceAfter).toBeDefined;
                            const [assetA, assetB, seller, price, amountBought] = event.event.data;
                            expect(price.eq(expectedPrice)).toBeTruthy();
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
        const expectedPrice = await cennzxSpot.getOutputPrice(tradeAssetA, tradeAssetB, amountBought);
        await cennzxSpot
            .assetSwapOutput(tradeAssetA, tradeAssetB, amountBought, 50000)
            .signAndSend(trader.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetPurchase') {
                            // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetABalanceAfter = (await ga.getFreeBalance(
                                tradeAssetA,
                                trader.address
                            )) as BN;
                            const tradeAssetBBalanceAfter = (await ga.getFreeBalance(
                                tradeAssetB,
                                trader.address
                            )) as BN;
                            expect(tradeAssetABalanceAfter).toBeDefined;
                            expect(tradeAssetBBalanceAfter).toBeDefined;
                            const [assetA, assetB, seller, price, amountBought] = event.event.data;
                            expect(price.eq(expectedPrice)).toBeTruthy();
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
        const expectedPrice = await cennzxSpot.getOutputPrice(tradeAssetA, tradeAssetB, amountBought);
        await cennzxSpot
            .assetTransferOutput(recipient.address, tradeAssetA, tradeAssetB, amountBought, 50000)
            .signAndSend(trader.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetPurchase') {
                            // check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetABalanceAfter = (await ga.getFreeBalance(
                                tradeAssetA,
                                trader.address
                            )) as BN;
                            const tradeAssetBBalanceAfter = (await ga.getFreeBalance(
                                tradeAssetB,
                                trader.address
                            )) as BN;
                            expect(tradeAssetABalanceAfter).toBeDefined;
                            expect(tradeAssetBBalanceAfter).toBeDefined;
                            const [assetA, assetB, seller, price, amountBought] = event.event.data;
                            expect(price.eq(expectedPrice)).toBeTruthy();
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
        const expectedPrice = await cennzxSpot.getInputPrice(tradeAssetA, tradeAssetB, sellAmount);
        await cennzxSpot
            .assetSwapInput(tradeAssetA, tradeAssetB, sellAmount, 1)
            .signAndSend(trader.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetPurchase') {
                            //check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetABalanceAfter = (await ga.getFreeBalance(
                                tradeAssetA,
                                trader.address
                            )) as BN;
                            const tradeAssetBBalanceAfter = (await ga.getFreeBalance(
                                tradeAssetB,
                                trader.address
                            )) as BN;
                            expect(tradeAssetABalanceAfter).toBeDefined;
                            expect(tradeAssetBBalanceAfter).toBeDefined;
                            const [assetA, assetB, seller, sellAmount, sellValue] = event.event.data;
                            expect(sellValue.eq(expectedPrice)).toBeTruthy();
                            done();
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
        const expectedPrice = await cennzxSpot.getInputPrice(tradeAssetA, tradeAssetB, sellAmount);
        await cennzxSpot
            .assetTransferInput(recipient.address, tradeAssetA, tradeAssetB, sellAmount, 1)
            .signAndSend(trader.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let trade = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
                        if (event.event.method === 'AssetPurchase') {
                            //check if ExtrinsicFailed or successful
                            trade = true;
                            const tradeAssetABalanceAfter = (await ga.getFreeBalance(
                                tradeAssetA,
                                trader.address
                            )) as BN;
                            const tradeAssetBBalanceAfter = (await ga.getFreeBalance(
                                tradeAssetB,
                                recipient.address
                            )) as BN;
                            expect(tradeAssetABalanceAfter).toBeDefined;
                            expect(tradeAssetBBalanceAfter).toBeDefined;
                            const [assetA, assetB, seller, sellAmount, sellValue] = event.event.data;
                            expect(sellValue.eq(expectedPrice)).toBeTruthy();
                        }
                    }
                    expect(trade).toEqual(true);
                    done();
                }
            });
    });
    it("Remove liquidity and receive 'RemoveLiquidity' event", async done => {
        const liquidity = await cennzxSpot.getLiquidityBalance(tradeAssetA, investor.address);
        await cennzxSpot
            .removeLiquidity(tradeAssetA, liquidity, 1, 1)
            .signAndSend(investor.address, async ({events, status}: SubmittableResult) => {
                if (status.isFinalized && events !== undefined) {
                    let isRemoved = false;
                    for (let i = 0; i < events.length; i += 1) {
                        const event = events[i];
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
});
