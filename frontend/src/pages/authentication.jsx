import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';

// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function Authentication() {

    const [username, setUsername] = React.useState();
    const [password, setPassword] = React.useState();
    const [name, setName] = React.useState();
    const [error, setError] = React.useState();
    const [message, setMessage] = React.useState();


    const [formState, setFormState] = React.useState(0);

    const [open, setOpen] = React.useState(false)


    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    let handleAuth = async () => {
        let result;
        try {
            if (formState === 0) {

                try{
                result = await handleLogin(username, password)
                } catch(err){
                    console.log(err);
                }
            }
            if (formState === 1) {
                result = await handleRegister(name, username, password);
                setMessage(result);
                setOpen(true);
                setError("")
                setFormState(0)
            }
        } catch (err) {

            console.log(err);
            let message = (err.response.data.message);
            setError(message);
        }
    }


    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        backgroundImage: 'url(https://images.unsplash.com/photo-1658937364065-60f3f6818724?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8d2FsbHBhcGVyJTIwNGt8ZW58MHx8MHx8fDA%3D)',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: 'black',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <Grid item xs={12} sx={{backgroundColor:'rgba(0,0,0,0.99)'}} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            bgcolor: "white",
                            // color: "white",
                            borderRadius: "20px",
                            padding: "20px",
                            boxShadow: "0px 0px 10px 2px rgba(0,0,0,0.35)"

                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                            <LockOutlinedIcon />
                        </Avatar>


                        <div >
                            <Button variant={formState === 0 ? "contained" : ""} onClick={() => { setFormState(0) }}>
                                Sign In
                            </Button>
                            <Button variant={formState === 1 ? "contained" : ""} onClick={() => { setFormState(1) }}>
                                Sign Up
                            </Button>
                        </div>

                        <Box component="form" noValidate sx={{ mt: 1 }}>
                            {formState === 1 ? <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Full Name"
                                name="username"
                                autoFocus
                                onChange={(e) => setName(e.target.value)}
                            /> : <></>}

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                // value={username}
                                autoFocus
                                onChange={(e) => setUsername(e.target.value)}

                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                // value={password}
                                type="password"
                                onChange={(e) => setPassword(e.target.value)}

                                id="password"
                            />

                            <p style={{ color: "red" }}>{error}</p>

                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                onClick={handleAuth}
                            >
                                {formState === 0 ? "Login " : "Register"}
                            </Button>

                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Snackbar

                open={open}
                autoHideDuration={4000}
                message={message}
            />

        </ThemeProvider>
    );
}