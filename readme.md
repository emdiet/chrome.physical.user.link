# Physical Chrome Implementation

[Physical](https://www.npmjs.com/package/physical) implementation for Node.js environments.

## Protocol Implementation

Protocol implementations by preference

1. WebRTC : WebRTC SDP
2. WebSocket-Consumer : Void

A WS Consumer can only connect to a WS Provider.

### Known Implementations of WS-P/C

|impl\provided| WebSocket-Provider | WebSocket-Consumer |
|---|---|---|
|**[physical-node](https://www.npmjs.com/package/physical-node)** | yes | yes |
|**[physical-chrome](https://www.npmjs.com/package/physical-chrome)** | no |  yes |

The two-way handshake enables both P-chrome and P-node to successfully initiate a connection with each other.

## Usage
Normal SYNQ ACK usage.
[see Physical](https://www.npmjs.com/package/physical) 