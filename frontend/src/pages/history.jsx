import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';

import { IconButton } from '@mui/material';
export default function History() {


    const { getHistoryOfUser } = useContext(AuthContext);

    const [meetings, setMeetings] = useState([])


    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // IMPLEMENT SNACKBAR
            }
        }

        fetchHistory();
    }, [])

    let formatDate = (dateString) => {

        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();

        return `${day}/${month}/${year}`

    }

    return (
        <div style={{backgroundColor:"#000000", height:"100vh", padding:"20px"}}>

<div style={{display:"flex", justifyContent:"left", alignItems:"left", marginBottom:"20px"}}>
            <IconButton onClick={() => {
                routeTo("/home")
            }}>
                <HomeIcon style={{color:"white"}} />
            </IconButton >
            
            <h2 style={{color:"white"}}>History</h2>
</div>

<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 3fr)", gap: "20px",marginBottom: "20px" }}>
            {
                (meetings.length !== 0) ? meetings.map((e, i) => {
                    return (


<>
                            <Card key={i} variant="outlined">


                                <CardContent>
                                    <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                        Code: {e.meetingCode}
                                    </Typography>

                                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                        Date: {formatDate(e.date)}
                                    </Typography>

                                </CardContent>


                            </Card>
</>

)
}) : <div style={{color:"white",margin:"auto", display:"inline-block"}}>Nothing to see for now...</div>

}

        </div>
</div>
    )
}
