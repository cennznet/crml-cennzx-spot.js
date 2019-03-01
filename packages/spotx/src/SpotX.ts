import {Api} from 'cennznet-api';

export class SpotX {
    private _api: Api;

    constructor(api: Api) {
        this._api = api;
    }

    get api(): Api {
        return this._api;
    }
}
