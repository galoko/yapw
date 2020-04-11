type Data = string | ArrayBuffer | Blob | ArrayBufferView;

export default class PromisedWebsocket {
	PromisedWebsocket() {
	}
	
	async open(url: string): Promise<void> {
	}
	
	async send(data: Data): Promise<void> {
	}
	
	async recv(): Promise<Data> {
		return new Promise<Data>((resolve, reject: any) : void => {
			
		});
	}
	
	async close(): Promise<void> {
	}
}