import React, { useContext, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import server from "../environment";
import { getPermissions } from "../helpers/video";
import { VideoContext } from "../contexts/VideoContext";
import GestureController from "../gesture/GestureController";
import { AuthContext } from "../contexts/AuthContext";
import Recorder from "recorder-js";
import VAD from "voice-activity-detection";

const server_url = server;

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoref = useRef();

  const { setLOCAL_VIDEO_REF } = useContext(VideoContext);
  const { isLoggedIn, getUserName } = useContext(AuthContext);

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState([]);

  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(true);

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(3);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  let [meetCode, setMeetCode] = useState("");

  const [adminID, setAdminID] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const vadHandleRef = useRef(null);

  const [transcription, setTranscription] = useState("");

  useEffect(
    () => async () => {
      await getPermissions({
        setVideoAvailable,
        setAudioAvailable,
        setScreenAvailable,
      });

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
            setLOCAL_VIDEO_REF(localVideoref.current);
          }
        }
      }
    },
    [setLOCAL_VIDEO_REF]
  );

  useEffect(() => {
    if (isLoggedIn) {
      // Fetch the username if the user is logged in
      (async () => {
        const fetchedUsername = await getUserName(); // Wait for the Promise to resolve
        setUsername(fetchedUsername || ""); // Set the username or fallback to an empty string
      })();
    }
  }, [isLoggedIn, getUserName]); // Dependencies: isLoggedIn and getUserName

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  useEffect(() => {
    const getMeetCode = () => {
      const url = window.location.href;
      const meetCode = url.split("/").pop().split("?")[0]; // Get the last part before any query parameters
      return meetCode;
    };

    let id = getMeetCode();

    setMeetCode(id);
    console.log("MEET CODE", id);
  }, [setMeetCode]);

  useEffect(() => {
    if (!askForUsername) {
      let stream;
      let recorder;
      let audioContext;
      let vadHandle;

      const startVAD = async () => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        recorder = new Recorder(audioContext, { numChannels: 1 });
        recorderRef.current = recorder;
        await recorder.init(stream);

        vadHandle = VAD(audioContext, stream, {
          onVoiceStart: () => {
            setIsRecording(true);
            recorder.start();
          },
          onVoiceStop: async () => {
            setIsRecording(false);
            const { blob } = await recorder.stop();
            const arrayBuffer = await blob.arrayBuffer();
            const audioBytes = new Uint8Array(arrayBuffer);

            if (socketRef.current?.connected) {
              socketRef.current.emit("audio-chunk", audioBytes);
            }
          },
          interval: 150,
          history: 4,
          threshold: 0.05,
        });

        vadHandleRef.current = vadHandle;
      };

      startVAD();

      return () => {
        vadHandle?.destroy();
        audioContext?.close();
        stream?.getTracks().forEach((track) => track.stop());
      };
    }
  }, [askForUsername]);

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      console.log("SET STATE HAS ", video, audio);
    }
  }, [video, audio]);
  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        console.log(description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        })
    );
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  let getDislayMediaSuccess = (stream) => {
    console.log("HERE");
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          getUserMedia();
        })
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    console.log("GOT MESSAGE FROM SERVER", fromId, message);
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });
    console.log("socketRef.current", socketRef.current);

    console.log(socketRef.current.on("signal", gotMessageFromServer));

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", meetCode);
      socketIdRef.current = socketRef.current.id;

      // socketRef.current.on("adminID", (id) => {
      //   console.log("Admin ID:", id);
      //   setAdminID(id);

      //   if (socketIdRef.current !== adminID) {
      //   console.log("Socket ID:", socketIdRef.current);
      //   //ask for permission
      //   // socketRef.current.emit("ask-permission", adminID);
      //   if (promptForPermission(socketIdRef.current)) {
      //     socketRef.current.emit("permission-granted", socketIdRef.current);
      //     console.log("Permission granted by admin");
      //   } else {
      //     socketRef.current.on("permission-denied", () => {
      //       console.log("Permission denied by admin");
      //       alert("Permission denied by admin");
      //       handleEndCall();
      //     });
      //   }
      // } else {
      //   console.log("You are the admin");
      //   socketRef.current.emit("permission-granted", socketIdRef.current);
      //   console.log("Permission granted by admin");
      // }

      // });

      // // send data on audio-chunks every 20 seconds
      // setInterval(() => {
      //   socketRef.current.emit("audio-chunk", audioHarvard);
      //   console.log(audioHarvard);
      // }, 20000);

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("transcription", (text) => {
        // document.getElementById("transcript").innerText = text;
        // console.log("Transcription:", text);

        // setTranscription((prev) => {
        //   const cleanedText = text.trim();
        //   return prev.endsWith(" ")
        //     ? prev + cleanedText
        //     : prev + " " + cleanedText;
        // });
        setTranscription((prev) => {
          return prev + text;
        });
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );
          // Wait for their ice candidate
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          // Wait for their video stream
          connections[socketListId].onaddstream = (event) => {
            console.log("BEFORE:", videoRef.current);
            console.log("FINDING ID: ", socketListId);

            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            );

            if (videoExists) {
              console.log("FOUND EXISTING");

              // Update the stream of the existing video
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              // Create a new video
              console.log("CREATING NEW");
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let handleVideo = () => {
    setVideo(!video);
  };
  let handleAudio = () => {
    setAudio(!audio);
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);
  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}
    window.location.href = "/";
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = () => {
    console.log(socketRef.current);
    socketRef.current.emit("chat-message", message, username);
    setMessage("");

    // this.setState({ message: "", sender: username })
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  const handleThumbsDown = () => {
    console.log("👎 Thumbs Down detected!");
    setMessage("👎");
  };

  const handleThumbsUp = () => {
    console.log("👍 Thumbs Up detected!");
    setMessage("👍");
  };

  const handleFist = () => {
    console.log("✊ Fist detected!");
    setMessage("✊");
  };

  const handleGesture = (gesture) => {
    switch (gesture) {
      case "THUMBS_DOWN":
        handleThumbsDown();
        break;
      case "THUMBS_UP":
        handleThumbsUp();
        break;
      case "FIST":
        handleFist();
        break;
      default:
        break;
    }
  };

  const promptForPermission = (id) => {
    if (adminID === null) return;

    if (id === adminID) {
      const permission = window.confirm(
        "You have a new user who wants to join the call. Do you want to allow them?"
      );
      if (permission) {
        return true;
      } else {
        return false;
      }
    }
    console.log("Permission request sent to admin");
  };

  return (
    <div
      style={{
        background: `url("https://img.freepik.com/free-photo/artistic-blurry-colorful-wallpaper-background_58702-8553.jpg?ga=GA1.1.1549324807.1651847985&semt=ais_hybrid&w=740")`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        height: "100vh",
      }}
    >
      {askForUsername === true ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            padding: "20px",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderRadius: "15px",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)",
            width: "100%",
            maxWidth: "600px",
            margin: "auto ",
            color: "white",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "20px",
                fontWeight: "400",
                marginBottom: "10px",
                color: "white",
              }}
            >
              Enter the Lobby by Username
            </p>
            <input
              id="outlined-basic"
              placeholder="Enter your username"
              value={username}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
                padding: "12px",
                width: "100%",
                maxWidth: "400px",
                marginBottom: "15px",
                outline: "none",
              }}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button
              variant="contained"
              style={{
                borderRadius: "8px",
                backgroundColor: "#6200ea",
                color: "white",
                fontWeight: "bold",
                padding: "10px 20px",
                textTransform: "none",
                fontSize: "16px",
                marginTop: "10px",
              }}
              onClick={connect}
            >
              Connect
            </Button>
          </div>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "18px",
                fontWeight: "400",
                marginBottom: "10px",
                color: "white",
              }}
            >
              This will be the video used for calling
            </p>
            <video
              style={{
                width: "100%",
                maxWidth: "400px",
                height: "auto",
                borderRadius: "10px",
                border: "2px solid #6200ea",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)",
              }}
              ref={localVideoref}
              autoPlay
              muted
            ></video>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>

                <div className={styles.chattingDisplay}>
                  {messages.length !== 0 ? (
                    messages.map((item, index) => {
                      return (
                        <div style={{ marginBottom: "20px" }} key={index}>
                          <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                          <p>{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="outlined-basic"
                    label="Enter Your chat"
                    variant="outlined"
                  />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessages} max={999} color="orange">
              <IconButton
                onClick={() => setModal(!showModal)}
                style={{ color: "white" }}
              >
                <ChatIcon />{" "}
              </IconButton>
            </Badge>
          </div>

          <video
            className={styles.meetUserVideo}
            ref={video ? localVideoref : null}
            autoPlay
            muted
          ></video>

          <GestureController onGesture={handleGesture} />

          <div className={styles.conferenceView}>
            {videos.map((video) => (
              <div key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                ></video>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* {isRecording ? <div className="redDot"></div> : null} */}
      <div
        id="transcript"
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          maxWidth: "300px",
        }}
      >
        {/* <h3 style={{ margin: "0" }}>Transcription:</h3> */}
        <p style={{ margin: "0" }}>{transcription}</p>
      </div>
    </div>
  );
}
