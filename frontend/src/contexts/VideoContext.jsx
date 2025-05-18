import { createContext, useState } from "react";

export const VideoContext = createContext({});

export const VideoProvider = ({ children }) => {

    const [LOCAL_VIDEO_REF, setLOCAL_VIDEO_REF] = useState(null);

    const getLOCAL_VIDEO_REF = () => {
        return LOCAL_VIDEO_REF;
    }

    const data = {
        LOCAL_VIDEO_REF : LOCAL_VIDEO_REF,
        setLOCAL_VIDEO_REF : setLOCAL_VIDEO_REF,
        getLOCAL_VIDEO_REF : getLOCAL_VIDEO_REF
    }

    return (
        <VideoContext.Provider value={data}>
            {children}
        </VideoContext.Provider>
    )  
}