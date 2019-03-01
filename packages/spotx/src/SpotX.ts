import {Api} from 'cennznet-api';

export class SpotX {
    private _api: Api;

    constructor(api2: Api) {
        this._api = api2;
    }

    get api(): Api {
        return this._api;
    }
}
