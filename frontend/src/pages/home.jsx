import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const { addToUserHistory } = useContext(AuthContext);
  let handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <div className="homeContainer">
      <div className="navBar">
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2 style={{color:"#dcc2ff"}}>Video Streaming App</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            onClick={() => {
              navigate("/history");
            }}
          >
            <IconButton style={{color:"#ffffff"}}>
              <RestoreIcon />
            </IconButton>
            <p style={{display:"inline", cursor: "pointer",marginLeft:"-3px", color:"#ffffff"}}>History</p>
          </div>

          <Button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
            style={{textTransform:"none",backgroundColor:"rgb(174, 0, 217)",color:"#dcc2ff",fontWeight:"700",padding: "4px",marginRight:"14px", marginLeft:"21px"}}
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="meetContainer">
        <div className="leftPanel">
          <div>
            <div style={{ display: "flex", gap: "10px"}}>
              <input
                onChange={(e) => setMeetingCode(e.target.value)}
                type="text"
                placeholder="Enter Meet Code"
                style={{backgroundColor:"rgba(255,255, 255, 0.90)", borderRadius:"10px",borderWidth:"0px",fontSize:"16px" ,padding:"20px", width:"18rem"}}
              />
              <Button onClick={handleJoinVideoCall} style={{borderRadius:"10px", backgroundColor:"#00000040"}} variant="contained">
                Join
              </Button>
            </div>
          </div>
        </div>
        <div className="rightPanel">
          <img className="animate" srcSet="/image-removebg-preview.png" alt="" />
        </div>
      </div>
    </div>
  );
}

export default withAuth(HomeComponent);
