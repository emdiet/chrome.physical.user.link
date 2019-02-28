# Physical Node Implementation

[Physical](https://www.npmjs.com/package/physical) implementation for Node.js environments.

## Protocol Implementation

Protocol implementations by preference

1. WebSocket-Consumer : Void
2. WebSocket-Provider : URL

A WS Consumer can only connect to a WS Provider, and vice versa. This module implements both roles, 
and the role is chosen automatically.

### Known Implementations of WS-P/C

|impl\provided| WebSocket-Provider | WebSocket-Consumer |
|---|---|---|
|**[physical-node](https://www.npmjs.com/package/physical)** | yes | yes |
|**[physical-chrome](https://www.npmjs.com/package/physical)** | no |  yes |

The two-way handshake enables both P-chrome and P-node to successfully initiate a connection with each other.

## Usage
Normal SYNQ ACK usage.
[see Physical](https://www.npmjs.com/package/physical) 