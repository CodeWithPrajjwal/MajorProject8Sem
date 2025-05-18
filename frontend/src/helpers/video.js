export const getPermissions = async ({
  setVideoAvailable,
  setAudioAvailable,
  setScreenAvailable}
) => {
  try {
    const videoPermission = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    if (videoPermission) {
      setVideoAvailable(true);
    } else {
      setVideoAvailable(false);
    }

    const audioPermission = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    if (audioPermission) {
      setAudioAvailable(true);
    } else {
      setAudioAvailable(false);
    }
    if (navigator.mediaDevices.getDisplayMedia) {
      setScreenAvailable(true);
    } else {
      setScreenAvailable(false);
    }
  } catch (error) {
    console.log(error);
  }
};
