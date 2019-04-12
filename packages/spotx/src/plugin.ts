import {CennzxSpot} from './CennzxSpot';
import {CennzxSpotRx} from './CennzxSpotRx';
import * as derives from './derives';

export default {
    injectName: 'cennzxSpot',
    sdkClass: CennzxSpot,
    sdkRxClass: CennzxSpotRx,
    types: {},
    derives: {
        cennzxSpot: derives,
    },
};
