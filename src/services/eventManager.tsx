import { EventType } from "@types";

export class EventManager {

    private _eventListeners = new Map<EventType, ((p_event?: any) => void)[]>()

    constructor() { }

    public addEventListener(p_eventType: EventType, p_callback: (p_event?: any) => void): () => void {
        if (!this._eventListeners.has(p_eventType)) {
            this._eventListeners.set(p_eventType, []);
        }

        this._eventListeners.get(p_eventType)?.push(p_callback);

        return () => {
            const callbacks = this._eventListeners.get(p_eventType);

            if (callbacks) {
                const index = callbacks.indexOf(p_callback);

                if (index !== -1) {
                    callbacks.splice(index, 1);
                    this._eventListeners.set(p_eventType, callbacks);
                }
            }
        }
    }

    public dispatchEvent(p_eventType: EventType, p_event?: any) {
        const callbacks = this._eventListeners.get(p_eventType);

        if (callbacks && callbacks.length > 0) {
            for (const callback of callbacks) {
                callback(p_event);
            }
        }
    }
}
