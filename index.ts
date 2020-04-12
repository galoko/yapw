const EMPTY_FUNCTION = (): void => {
    //
};

export default class PromisedWebsocket {
    private socket: WebSocket | null = null;
    private messageBuffer: any[] = [];
    private timeoutTimer: any = null;
    private resolve: Function = EMPTY_FUNCTION;
    private reject: Function = EMPTY_FUNCTION;
    private defaultTimeout = 0;

    PromisedWebsocket(defaultTimeout?: number): void {
        if (defaultTimeout !== undefined) {
            this.defaultTimeout = defaultTimeout;
        }
    }

    public async open(url: string, timeout?: number, protocols?: string | string[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.socket !== null) {
                reject('Socket is already open.');
                return;
            }

            this.resolve = resolve;
            this.reject = reject;

            this.socket = new WebSocket(url, protocols);
            this.socket.onopen = (): void => this.onOpen();
            this.socket.onmessage = (e: MessageEvent): void => this.onMessage(e);
            this.socket.onclose = (): void => this.onClose();

            if (timeout === undefined) {
                timeout = this.defaultTimeout;
            }
            if (timeout > 0) {
                this.timeoutTimer = setTimeout((): void => this.onTimeout(), timeout);
            }
        });
    }

    public async send(data: string | ArrayBuffer | Blob | ArrayBufferView): Promise<void> {
        return new Promise<any>((resolve, reject: any): void => {
            if (this.socket === null || this.socket.readyState !== 1) {
                reject('Not connected.');
                return;
            }

            this.socket.send(data);

            resolve();
        });
    }

    public async recv(timeout?: number): Promise<any> {
        return new Promise<any>((resolve, reject: any): void => {
            if (this.socket === null || this.socket.readyState !== 1) {
                reject('Socket is not open.');
                return;
            }

            if (this.isPendingPromise()) {
                reject('Another promise is pending.');
                return;
            }

            this.resolve = resolve;
            this.reject = reject;

            if (timeout === undefined) {
                timeout = this.defaultTimeout;
            }
            if (timeout > 0) {
                this.timeoutTimer = setTimeout((): void => this.onTimeout(), timeout);
            }

            this.processRecv();
        });
    }

    public async close(): Promise<void> {
        return new Promise<any>((resolve: any): void => {
            if (this.socket !== null) {
                this.socket.close();
                this.socket = null;
            }

            resolve();
        });
    }

    // internals

    private isPendingPromise(): boolean {
        return this.resolve !== EMPTY_FUNCTION;
    }

    private processRecv(): void {
        if (this.isPendingPromise() && this.messageBuffer.length > 0) {
            const message = this.messageBuffer.shift();

            clearTimeout(this.timeoutTimer);

            const resolve = this.resolve;
            this.resolve = EMPTY_FUNCTION;
            resolve(message);
        }
    }

    // events

    private onOpen(): void {
        clearTimeout(this.timeoutTimer);

        const resolve = this.resolve;
        this.resolve = EMPTY_FUNCTION;
        resolve();
    }

    private onMessage(event: MessageEvent): void {
        this.messageBuffer.push(event.data);
        this.processRecv();
    }

    private onTimeout(): void {
        this.resolve = EMPTY_FUNCTION;
        this.reject('Operation timeout.');
    }

    private onClose(): void {
        this.resolve = EMPTY_FUNCTION;
        this.reject('Socket was disconnected.');
    }
}
