export class CacheableObject<T> {

    private _request: () => Promise<T>;
    private _mapFunction: (p_response: any) => T;
    private _durationInMilliseconds: number;

    private _data: T | undefined = undefined;
    private _lastFetch: Date | undefined = undefined;

    constructor(p_request: () => Promise<T>, p_mapFunction: (p_response: any) => T, p_durationInSeconds: number) {
        this._request = p_request;
        this._mapFunction = p_mapFunction
        this._durationInMilliseconds = p_durationInSeconds * 1000;
    }

    public async getData(p_force = false): Promise<T> {
        if (!p_force && this._data != null && this._lastFetch != null) {
            const duration = new Date().getTime() - this._lastFetch.getTime();
            const valid = duration <= this._durationInMilliseconds;

            if (valid) {
                return this._data;
            }
        }

        await this._request().then(
            p_response => {
                this._data = this._mapFunction(p_response);
                this._lastFetch = new Date();
            },
            p_error => {
                if (!this._data) {
                    throw new Error(p_error);
                }
            }
        );

        return this._data as T;
    }

    public reset() {
        this._data = undefined;
        this._lastFetch = undefined;
    }
}