import React, { useEffect, useRef, useContext } from "react";
import { VideoContext } from "../contexts/VideoContext";
import { detectGesture } from "./gestureMapping";

const Hands = window.Hands;
const Camera = window.Camera;

const GestureController = ({ onGesture }) => {
  const videoRef = useRef(null);

  const { getLOCAL_VIDEO_REF } = useContext(VideoContext);

  useEffect(() => {
    if (videoRef.current === null) {
      videoRef.current = getLOCAL_VIDEO_REF();
    }
    try {
      const hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults((results) => {
        if (
          results.multiHandLandmarks &&
          results.multiHandLandmarks.length > 0
        ) {
          const landmarks = results.multiHandLandmarks[0];
          const gesture = detectGesture(landmarks);
          if (gesture) {
            onGesture(gesture);
          }
        }
      });

    if (typeof videoRef.current !== "undefined" && videoRef.current !== null) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  } catch (error) {
    console.error("Error initializing Hands:", error);
  }
  }, []);

  return null;
};

export default GestureController;
