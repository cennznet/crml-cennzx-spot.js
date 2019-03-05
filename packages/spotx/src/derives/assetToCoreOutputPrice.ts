import {combineLatest, Observable, of} from 'rxjs';
import {ApiInterface$Rx} from '@polkadot/api/types';
import {AccountId, AccountIndex, Address} from '@polkadot/types/index';

import {DerivedBalances} from '../types';
import {drr} from '../util/drr';
import {votingBalance} from './votingBalance';

export function votingBalances(api: ApiInterface$Rx) {
    return (addresses?: Array<AccountId | AccountIndex | Address | string>): Observable<Array<DerivedBalances>> => {
        return !addresses || !addresses.length
            ? of([]).pipe(drr())
            : combineLatest(...addresses.map(votingBalance(api))).pipe(drr());
    };
}
