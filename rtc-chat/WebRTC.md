# WebRTC

## P2P connection

```js
const localConnection = new RTCPeerConnection();

// Create the data channel and establish its event listeners
const sendChannel = localConnection.createDataChannel("sendChannel");
sendChannel.addEventListener("open", handleSendChannelStatusChange);
sendChannel.addEventListener("close", handleSendChannelStatusChange);

// Create the remote connection and its event listeners

const remoteConnection = new RTCPeerConnection();
remoteConnection.addEventListener("datachannel", receiveChannelCallback);

// Set up the ICE candidates for the two peers
localConnection.addEventListener("icecandidate", function (e) {
  if (e.candidate) {
    remoteConnection
      .addIceCandidate(e.candidate)
      .catch(handleAddCandidateError);
  }
});

remoteConnection.addEventListener("icecandidate", function (e) {
  if (e.candidate) {
    localConnection.addIceCandidate(e.candidate).catch(handleAddCandidateError);
  }
});

// Now create an offer to connect; this starts the process

const offer = await localConnection.createOffer();
await localConnection.setLocalDescription(offer);
await remoteConnection.setRemoteDescription(localConnection.localDescription);
const answer = await remoteConnection.createAnswer();
await remoteConnection.setLocalDescription(answer);
await localConnection.setRemoteDescription(remoteConnection.localDescription);
```

## References

- [WebRTC API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebRTC_API)
