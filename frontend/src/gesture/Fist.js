const COOLDOWN_DURATION = 1500;
let lastDetectedTime = 0;

const FIST_DISTANCE_THRESHOLD = 0.09; // Adjust this based on experimentation

export const checkFist = (landmarks) => {
  const fingerTips = [8, 12, 16, 20];
  const palmBase = landmarks[0]; // Wrist
  const middleKnuckle = landmarks[9]; // Base of the middle finger

  // Check if all fingertips are close to the palm region
  const fingersCloseToPalm = fingerTips.every((tipIndex) => {
    const tip = landmarks[tipIndex];
    // Calculate 3D distance (you might need a utility function for this)
    const distanceTipToPalm = Math.sqrt(
      (tip.x - palmBase.x) ** 2 + (tip.y - palmBase.y) ** 2 + (tip.z - palmBase.z) ** 2
    );
    return distanceTipToPalm < FIST_DISTANCE_THRESHOLD;
  });

  // Check if the thumb is also relatively close to the other fingers
  const thumbTip = landmarks[4];
  const distanceThumbToFingers =
    (Math.sqrt((thumbTip.x - landmarks[8].x) ** 2 + (thumbTip.y - landmarks[8].y) ** 2 + (thumbTip.z - landmarks[8].z) ** 2) +
     Math.sqrt((thumbTip.x - landmarks[12].x) ** 2 + (thumbTip.y - landmarks[12].y) ** 2 + (thumbTip.z - landmarks[12].z) ** 2) +
     Math.sqrt((thumbTip.x - landmarks[16].x) ** 2 + (thumbTip.y - landmarks[16].y) ** 2 + (thumbTip.z - landmarks[16].z) ** 2) +
     Math.sqrt((thumbTip.x - landmarks[20].x) ** 2 + (thumbTip.y - landmarks[20].y) ** 2 + (thumbTip.z - landmarks[20].z) ** 2)) / 4;

  const thumbCloseToFingers = distanceThumbToFingers < FIST_DISTANCE_THRESHOLD * 1.5; // Adjust multiplier

  // Optional: Check if fingers are bent (though distance might imply this)
  const fingersBent = fingerTips.every((tipIndex) => {
    const tip = landmarks[tipIndex];
    const knuckle = landmarks[tipIndex - 1];
    const base = landmarks[tipIndex - 2];
    // Check if the y-coordinate progresses inwards (can be orientation-dependent)
    return tip.y > knuckle.y && knuckle.y > base.y; // Or similar logic
  });

  const now = Date.now();
  const isFist = fingersCloseToPalm && thumbCloseToFingers; // You might add fingersBent

  if (isFist && now - lastDetectedTime > COOLDOWN_DURATION) {
    lastDetectedTime = now;
    return true;
  }

  return false;
};

// Helper function to calculate 3D distance (if you don't have one)
// function calculateDistance(p1, p2) {
//   return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
// }