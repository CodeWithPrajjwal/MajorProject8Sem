const COOLDOWN_DURATION = 1500;
let lastDetectedTime = 0;

export const checkThumbsDown = (landmarks) => {
  const thumbTipY = landmarks[4].y;
  const thumbIPY = landmarks[3].y;
  const indexMCPY = landmarks[5].y;
  const middleMCPY = landmarks[9].y;
  const ringMCPY = landmarks[13].y;
  const pinkyMCPY = landmarks[17].y;

  const isThumbDown = thumbTipY > thumbIPY;
  const isOtherFingersDown = [indexMCPY, middleMCPY, ringMCPY, pinkyMCPY].every(
    (joint) => thumbTipY > joint
  );

  const result = isThumbDown && isOtherFingersDown;

  const now = Date.now();

  if (result && now - lastDetectedTime > COOLDOWN_DURATION) {
    lastDetectedTime = now;
    return true;
  }

  return false;
};