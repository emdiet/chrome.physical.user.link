export let config : IConfig = {
    permissiveMode: false,
    rtcConfiguration : {
        iceServers: [
            {"urls":"stun://stun.l.google.com:19305"},
            {"urls":"stun://stun.gmx.net:3478"}
        ],
        iceCandidatePoolSize: 2
    }
};

interface IConfig {
    permissiveMode : boolean; //whether to wait for stalled (ice failed/disconnected) connections.
    rtcConfiguration : RTCConfiguration;
}