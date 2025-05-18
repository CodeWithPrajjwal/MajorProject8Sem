import React from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";
export default function LandingPage() {
  const router = useNavigate();

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <h2>Video Streaming App</h2>
        </div>
        <div className="navlist">
          <p 
            onClick={() => {
              router("/annonymousMeeting");
            }}
          >
            Join as Guest
          </p>
          <p
            onClick={() => {
              router("/auth");
            }}
          >
            Register
          </p>
          <div
            onClick={() => {
              router("/auth");
            }}
            role="button"
          >
            <p>Login</p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            <span style={{color:"#ae00d9"}}>Connect</span> with your loved
            Ones
          </h1>

          <p>Cover a distance by AI-Enhanced Video Conferencing Platform</p>
          <div role="button">
            <Link to={"/auth"}>Get Started</Link>
          </div>
        </div>
        <div>
          <img className="animate" src="/image-removebg-preview.png" alt="" />
        </div>
      </div>
    </div>
  );
}
