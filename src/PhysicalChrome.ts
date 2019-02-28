import {ACK, Physical, SYNQ} from "physical";
import {config} from "../config";

enum State{
    EMPTY,
    INITIATED,
    RESPONDED,
    FINALIZING,
    OPEN,
    CLOSED
}

export class PhysicalChrome implements Physical{
    private rtcPeerConnection : RTCPeerConnection = null as any;
    private socket : RTCDataChannel | WebSocket = null as any;

    private state = State.EMPTY;

    private sendLambda : (message : string)=>void = null as any;

    private onMessage = ( str : string ) => { console.warn("onmessage not set!") };
    private onOpen = () => { console.warn("onOpen not set!") };
    private onClose = () => { console.warn("onClose not set!") };

    close(): void {
        if(this.state != State.CLOSED) this.onClose();
        this.state = State.CLOSED;

        this.rtcPeerConnection && this.rtcPeerConnection.close();
        try{
            this.socket && this.socket.close();
        }catch (e) {
            if(e.message === 'WebSocket was closed before the connection was established'){
                //allowed
            } else {
                throw e;
            }
        }finally {
            delete this.onMessage;
        }
    }

    open(ack: ACK): void {
        let self = this;
        if(this.state != State.INITIATED) throw("wrong state exception");
        if(ack.protocol === "WebRTC"){

        }else if(ack.protocol == "WebSocket-Provider"){
            this.terminateRTC();
            this.connectToWebSocket(ack.body[0]).
            then(()=>self.webSocketOpenFinalizeHandshake());
        }
    }

    private terminateRTC(){
        this.socket.close();
        delete this.socket;
        this.rtcPeerConnection.close();
        delete this.rtcPeerConnection;
    }

    private doOnNegotiationSuccess(){
        this.onOpen();
    }

    private buildRTCPeerConnection(){
        let self = this;
        if(this.rtcPeerConnection) throw("an RTCPeerConnection has already been instantiated")
        this.rtcPeerConnection = new RTCPeerConnection(config.rtcConfiguration);
        this.socket = this.rtcPeerConnection.createDataChannel("physical", {
            negotiated: true,
            id: 0
        });
        this.rtcPeerConnection.oniceconnectionstatechange = () => {
            switch (self.rtcPeerConnection.iceConnectionState) {
                case "failed":
                case "disconnected": if(!config.permissiveMode) break;
                case "closed": self.close(); break;
                case "connected": self.doOnNegotiationSuccess(); break;
            }
        };
        this.socket.onmessage = event => self.onMessage(event.data);
    }

    private async buildOffer() : Promise<string> {
        let self = this;
        const initDescription = await this.rtcPeerConnection.createOffer();
        await self.rtcPeerConnection.setLocalDescription(initDescription);
        await new Promise( a => { //no more ice candidates
            self.rtcPeerConnection.onicecandidate = ev => !ev.candidate && a()});
        // @ts-ignore, if there's an NPE here the whole node is toast anyways.
        return self.rtcPeerConnection.localDescription.sdp;
    }

    private webSocketOpenFinalizeHandshake(){
        this.socket.send("RFT"); // ready for transmission
        this.state = State.OPEN;
        this.onOpen();
    }

    async request(): Promise<SYNQ> {
        if(this.state != State.EMPTY) throw("wrong state exception");
        this.state = State.INITIATED;
        this.buildRTCPeerConnection();
        return {
            author: "physical-chrome",
            supported: ["WebRTC", "WebSocket-Consumer"],
            body: [await this.buildOffer(), ""]
        }
    }

    private async connectToWebSocket(url : string){
        let self = this;

        this.socket = new WebSocket(url);
        this.socket.onmessage = (event : MessageEvent) => {
            if(event.data == "RFT"){
                self.socket.onmessage = (event2 : MessageEvent) => {
                    self.onMessage(event2.data);
                };
                self.state = State.OPEN;
                self.doOnNegotiationSuccess();
            }else{
                console.error("peer failed to honor contract");
                console.error("out of state message: "+event.data);
                self.close();
            }
        };
        this.socket.onopen = ()=>console.log("opening socket");
        this.socket.onclose = ()=>self.close();
    }

    private async buildAnswer(sdp : string) : Promise<string> {
        let self = this;
        await this.rtcPeerConnection.setRemoteDescription({
            sdp,
            type : "offer"
        });
        const initDescription = await this.rtcPeerConnection.createAnswer();
        await self.rtcPeerConnection.setLocalDescription(initDescription);
        await new Promise( a => { //no more ice candidates
            self.rtcPeerConnection.onicecandidate = ev => !ev.candidate && a()});
        // @ts-ignore, if there's an NPE here the whole node is toast anyways.
        return self.rtcPeerConnection.localDescription.sdp;
    }

    async respond(synq: SYNQ): Promise<ACK> {
        if(this.state != State.EMPTY) throw("wrong state exception");
        this.state = State.RESPONDED;
        if(synq.supported.includes("WebRTC")){
            let sdp = synq.body[synq.supported.indexOf("WebRTC")];
            this.buildRTCPeerConnection();
            return {
                author: "physical-chrome",
                protocol: "WebRTC",
                body: [await this.buildAnswer(sdp)]
            }
        }else if(synq.supported.includes("WebSocket-Provider")){
            let url = synq.body[synq.supported.indexOf("WebSocket-Provider")];
            //destroy rtc
            this.terminateRTC();
            //build ws
            await this.connectToWebSocket(url); //could be run asynchronously
            return {
                author: "physical-chrome",
                protocol: "WebSocket-Consumer",
                body: [""]
            }
        }else{
            throw "No Compatible Protocol";
        }
    }

    send(message: string): void {
        if(this.state != State.OPEN) throw("connection not open");
        try{
            this.socket.send(message);
        }catch (e) {
            this.close();
            throw("failed to send message");
        }
    }

    setOnClose(f: () => void): void {
        this.onClose = f;
    }

    setOnMessage(f: (message: string) => void): void {
        this.onMessage = f;
    }

    setOnOpen(f: () => void): void {
        this.onOpen = f;
    }
}