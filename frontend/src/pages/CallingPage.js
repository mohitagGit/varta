import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";
import "../../src/App.css";
import {
  Input,
  Button,
  Text,
  Flex,
  Card,
  HStack,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  Center,
} from "@chakra-ui/react";
import { PhoneIcon } from "@chakra-ui/icons";
import process from "process";
import BackToHomeButton from "../components/BackToHomeButton";
import incomingCallAudioFile from "../sounds/incoming_call.mp3";
window.process = process;

// Connect to the Node.js backend
var backend_url = "http://localhost:4000";
if (window.location.host === "varta-ls5r.onrender.com") {
  backend_url = "https://varta-ls5r.onrender.com";
}
const socket = io.connect(backend_url);

const CallingPage = () => {
  const { chatId } = useParams();
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const callAudioRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("current-user"));

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        } else {
          myVideo.current = {};
          myVideo.current.srcObject = currentStream;
        }
      });

    socket.on("me", (id) => {
      console.log("my id:" + id);
      setMe(id);
    });

    socket.on("callUser", (data) => {
      console.log("User calling data: ", data);
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
      playIncomingCallAudio();
    });

    socket.on("call-declined", () => {
      console.log("Call declined by the other user");
      if (myVideo.current) {
        myVideo.current.destroy();
      }
    });
  }, []);

  // to play incoming call audio
  const playIncomingCallAudio = () => {
    if (!callAudioRef.current) {
      callAudioRef.current = new Audio(incomingCallAudioFile);
    }

    callAudioRef.current.loop = true;
    callAudioRef.current.play().catch((error) => {
      console.error("Error playing incoming call sound:", error);
    });
  };

  const pauseIncomingCallAudio = () => {
    if (callAudioRef.current) {
      callAudioRef.current.pause();
      callAudioRef.current.currentTime = 0;
    }
  };

  const callUserHandler = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: currentUser.name,
      });
    });
    peer.on("stream", (remoteStream) => {
      userVideo.current.srcObject = remoteStream;
    });
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
      console.log("Call accepted: ", signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    pauseIncomingCallAudio();
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (remoteStream) => {
      userVideo.current.srcObject = remoteStream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const declineCall = () => {
    // Notify the caller that the call is declined
    // socket.emit("decline-call", { target: incomingCall.from });
    setReceivingCall(false);
    setCallAccepted(false);
    pauseIncomingCallAudio();
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  };

  return (
    <Flex direction="column" h="100vh" maxW="lg" mx="auto" p={4} bg="lightgray">
      <Card p={4}>
        <BackToHomeButton link={`/chats/${chatId}/edit`} />
        <div className="container">
          <div className="myId">
            <CopyToClipboard text={me} style={{ marginBottom: "1rem" }}>
              <Button size="md" color="green">
                Click to Copy ID: {me}
              </Button>
            </CopyToClipboard>

            <InputGroup size="md">
              <InputLeftAddon>Call to: </InputLeftAddon>
              <Input
                variant="filled"
                value={idToCall}
                onChange={(e) => setIdToCall(e.target.value)}
              />
              <InputRightAddon>
                {callAccepted && !callEnded ? (
                  <Button
                    size="md"
                    variant="link"
                    colorScheme="red"
                    onClick={leaveCall}
                  >
                    End
                  </Button>
                ) : (
                  <Button
                    color="primary"
                    aria-label="call"
                    onClick={() => callUserHandler(idToCall)}
                  >
                    <PhoneIcon fontSize="large" />
                  </Button>
                )}
              </InputRightAddon>
            </InputGroup>
          </div>
          <div className="video-container">
            <div className="video">
              {stream && (
                <>
                  <Center>
                    <video
                      playsInline
                      muted
                      ref={myVideo}
                      autoPlay
                      style={{ width: "150px", border: "1px solid black" }}
                    />
                  </Center>
                  <div style={{ textAlign: "center" }}>
                    You: {currentUser.name}
                  </div>
                </>
              )}
            </div>
            <div className="video">
              {callAccepted && !callEnded ? (
                <>
                  <Center>
                    <video
                      playsInline
                      ref={userVideo}
                      autoPlay
                      style={{ width: "auto", border: "1px solid black" }}
                    />
                  </Center>
                  <div style={{ textAlign: "center" }}>{name}</div>
                </>
              ) : null}
            </div>
          </div>
          <div>
            {receivingCall && !callAccepted ? (
              <div className="caller">
                <h1>{name} is calling...</h1>
                <Button size="md" colorScheme="teal" onClick={answerCall}>
                  Answer
                </Button>
                <Button size="md" colorScheme="red" onClick={declineCall}>
                  Decline
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </Flex>
  );
};

export default CallingPage;
