import { checkThumbsDown } from "./ThumbsDown";
import { checkThumbsUp } from "./ThumbsUp";
import { checkFist } from "./Fist";
export const detectGesture = (landmarks) => {
  if (checkThumbsDown(landmarks)) return "THUMBS_DOWN";

  if(checkThumbsUp(landmarks)) return "THUMBS_UP";

  if(checkFist(landmarks)) return "FIST";

  return null;
};
