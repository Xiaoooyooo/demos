/** @type {RTCPeerConnection} */
let connection;
/** @type {RTCDataChannel} */
let channel;
/** @type {string} */
let sessionId;

class SSE {
  clientId;
  constructor() {
    this.init();
  }
  async init() {
    const response = await fetch("/sse");
    if (!response.ok) {
      throw "connection error";
    }
    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      this.onData(JSON.parse(value));
    }
  }

  async send(type, data) {
    if (!this.clientId) {
      throw "sse is not connected!";
    }
    const search = new URLSearchParams();
    search.set("clientId", this.clientId);
    if (sessionId) {
      search.set("sessionId", sessionId);
    }
    const response = await fetch(`/message?${search.toString()}`, {
      method: "post",
      body: JSON.stringify({ type, data }),
    });
    if (!response.ok) {
      throw new Error("send message error");
    }
  }

  /** @param {{type: string; data: any}} chunk  */
  onData(chunk) {
    console.log("chunk", chunk);
    const { type, data } = chunk;
    switch (type) {
      case "connect":
        this.clientId = data.id;
        break;
      case "signinResult":
        if (data.success) {
          onSignin(data.number);
        } else {
          alert("signin failed");
        }
        break;
      case "session":
        sessionId = data.sessionId;
        break;
      case "callResult":
        if (!data.success) {
          console.log("call failed");
          sessionId = undefined;
        } else {
          console.log("call success");
          handleCall();
        }
        break;
      case "onCall":
        console.log("you have a call");
        const accept = window.prompt("You have a call, accept?(yes/no)", "yes");
        if (accept?.toLocaleLowerCase() === "yes") {
          handleAcceptCall();
          sessionId = data.sessionId;
          sse.send("onCallAction", { accept: true });
        } else {
          sse.send("onCallAction", { accept: false });
        }
        break;
      case "remoteOffer":
        onRemoteOffer(data.offer);
        break;
      case "remoteAnswer":
        onRemoteAnswer(data.answer);
        break;
      case "remoteCandidate":
        onRemoteCandidate(data.candidate);
        break;
    }
  }
}

const sse = new SSE();

const numberInput = document.getElementById("number");
const signinButton = document.getElementById("signin");
const callButton = document.getElementById("call");
const sendMessageButton = document.getElementById("send-message");

signinButton.addEventListener("click", function () {
  const number = numberInput.value;
  if (!number) {
    return;
  }
  handleSignin(number);
});

callButton.addEventListener("click", function () {
  const number = document.getElementById("call-number").value;
  if (!number) {
    return;
  }
  sse.send("call", { number });
});

sendMessageButton.addEventListener("click", function () {
  if (channel.readyState !== "open") {
    console.error("Channel is not open");
    return;
  }
  const message = document.getElementById("message").value;
  if (!message) {
    return;
  }
  appendMessageElement(message);
  channel.send(message);
});

function handleSignin(number) {
  signinButton.disabled = true;
  sse.send("signin", { number });
}

function onSignin(number) {
  signinButton.disabled = false;
  document.getElementById("signin-control").style.display = "none";
  document.getElementById("phone-control").style.display = "block";
  const info = document.getElementById("number-info");
  info.innerText = `Your number is ${number}`;
}

async function handleCall() {
  connection = new RTCPeerConnection();
  channel = connection.createDataChannel("chat");
  bindChannelEvents();
  const offer = await connection.createOffer();
  connection.setLocalDescription(offer);
  sse.send("offer", { offer });
  connection.addEventListener("icecandidate", function (e) {
    if (e.candidate) {
      sse.send("candidate", { candidate: e.candidate });
    }
  });
}

async function handleAcceptCall() {
  connection = new RTCPeerConnection();
  connection.addEventListener("datachannel", function (e) {
    channel = e.channel;
    bindChannelEvents();
  });
}

function bindChannelEvents() {
  channel.addEventListener("open", function () {
    console.log("channel open");
    document.getElementById("chat-control").style.display = "block";
  });

  channel.addEventListener("message", function (e) {
    console.log("on message", e);
    appendMessageElement(e.data);
  });

  channel.addEventListener("close", function () {
    console.log("channel close");
    connection = null;
    channel = null;
    document.getElementById("chat-control").style.display = "none";
  });
}

function appendMessageElement(text) {
  const message = document.createElement("div");
  message.innerText = text;
  document.getElementById("messages").appendChild(message);
}

async function onRemoteOffer(offer) {
  connection.setRemoteDescription(offer);
  const answer = await connection.createAnswer();
  connection.setLocalDescription(answer);
  sse.send("answer", { answer });
}

function onRemoteAnswer(answer) {
  connection.setRemoteDescription(answer);
}

function onRemoteCandidate(candidate) {
  connection.addIceCandidate(candidate);
}
