Yet another promised websocket implementation.

Feels more like blocking socket.

e.g. 

```
const socket = new PromisedWebsocket();
await socket.open('wss://echo.websocket.org');
await socket.send('ping');
const pong = await socket.recv();
```
