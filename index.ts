const EMPTY_FUNCTION = () => { };

export default class PromisedWebsocket {
	private socket: WebSocket | null = null;
	private messageBuffer: any[] = [];
	private timeoutTimer: any = null;
    private resolve: Function = EMPTY_FUNCTION;
    private reject: Function = EMPTY_FUNCTION;

	PromisedWebsocket() {
	}
	
	public async open(url: string, timeout: number, protocols: string | string[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;

            this.socket = new WebSocket(url, protocols);
            this.socket.onopen = (e: Event): void => this.onOpen();
            this.socket.onmessage = (e: MessageEvent): void => this.onMessage(e);
            this.socket.onclose = (e: CloseEvent): void => this.onClose();

            this.timeoutTimer = setTimeout((e: Event): void => this.onTimeout(), timeout);
        });
	}
	
	public async send(data: string | ArrayBuffer | Blob | ArrayBufferView): Promise<void> {
		return new Promise<any>((resolve, reject: any) : void => {
            if (this.socket === null || this.socket.readyState !== 1) {
                reject('Not connected.');
                return;
			}
			
			this.socket.send(data);

            resolve();
		});
	}
	
	public async recv(timeout: number): Promise<any> {
		return new Promise<any>((resolve, reject: any) : void => {
            if (this.isPendingPromise()) {
                reject('Another promise is pending.');
                return;
            }

            this.resolve = resolve;
            this.reject = reject;

            if (this.socket === null || this.socket.readyState !== 1) {
				this.resolve = EMPTY_FUNCTION;
                this.reject('Not connected.');
                return;
            }

            this.timeoutTimer = setTimeout((e: Event): void => this.onTimeout(e), timeout);

            this.processRecv();
		});
	}
	
	public async close(): Promise<void> {
		return new Promise<any>((resolve, reject: any) : void => {
            if (this.socket !== null) {
                this.socket.close();
            }

            resolve();
		});
	}

    // internals
    
    private isPendingPromise() : boolean {
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
        this.reject('Timeout.');
    }

    private onClose(): void {
		this.resolve = EMPTY_FUNCTION;
        this.reject('Closed.');
    }
}