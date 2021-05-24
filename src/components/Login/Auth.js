import React, { useState } from 'react'
import GoogleLogin from 'react-google-login';
import {Avatar ,Button , Paper ,Grid ,Typography ,Container} from '@material-ui/core'
import useStyles from './authStyles';
import Input from './Input';
import { FcGoogle } from "react-icons/fc";
import {useDispatch} from 'react-redux';
import {useHistory} from 'react-router-dom';
import {signin ,signup} from '../../actions/auth'
import {GiWingedSword} from "react-icons/gi";
export const Auth = () => {
    const classes  = useStyles();
    const [isSignup, setisSignup] = useState(false)
    const dispatch = useDispatch();
    const history = useHistory();

    const googleSuccess = async (res) =>{
        const result  = res?.profileObj;
        const token = res?.tokenId;
        try {
            dispatch( {type : 'AUTH' ,data : {result,token}})
            history.push('/');
        } catch (error) {
            console.log(error);
        }
    }
    const googleFailure = ()=>{
        console.log("Google Sign in was unsuccessful..try again!!");
    }

    const initialFormState = {
        firstName : '', lastName :'', email : '', password : '', confirmPassword : ''
    }
    const [formData, setformData] = useState(initialFormState)

    const handleChange = (e) =>{
        setformData({ ...formData,[e.target.name] : e.target.value});
    }
    const handleSubmit = (e) =>{
        e.preventDefault();
        console.log(formData)
        if(isSignup){
            dispatch(signup(formData,history))
        }else{
            dispatch(signin(formData,history))
        }
    }
   
    const [showpassword, setshowpassword] = useState(false);
    const handleShowPassword = () =>{
        setshowpassword((prevshowPassword) => !prevshowPassword);
    }
    const switchMode = () =>{
        setisSignup((previsSignup)=> !previsSignup)
        setshowpassword(false)
    }
    return (
       <Container component = "main" maxWidth ="xs">
            <Paper className = {classes.paper} elevation = {3}>
                <Avatar className = {classes.avatar}>
                    <GiWingedSword/>
                </Avatar>
                <Typography className ={classes.signintag} variant = "h5">{isSignup ? 'SIGN UP' : 'SIGN IN'}</Typography>
                <form className ="classes.form" onSubmit = {handleSubmit}>
                    <Grid container spacing ={2}>
                        {
                            isSignup && (
                                <>
                                    <Input name  = "firstName" label = "First Name"
                                    handleChange = {handleChange} autoFocus half/>
                                     <Input name  = "lastName" label = "Last Name"
                                    handleChange = {handleChange}  half/>

                                </>
                            )
                        }
                        <Input name = "email" label = "Email Address" handleChange = {handleChange} type = "email"/>
                        <Input name = "password" label = "Password" handleChange = {handleChange} type = {showpassword ?"text" :"password"} handleShowPassword ={handleShowPassword}/>
                        {
                            isSignup && <Input  name = "confirmPassword" label = "Repeat Password" handleChange ={handleChange}/>
                        }
                    </Grid>

                    <Button type = "submit"  fullWidth variant  ="contained" color ="primary" className ={classes.submit}>
                        {isSignup ? 'SIGN UP' : 'SIGN IN'}
                    </Button>
                    <GoogleLogin
                        clientId = "146423725963-28dc9pj5sbjj12d44lbtlnimqltcmkrb.apps.googleusercontent.com"
                        render = { (renderProps) =>(
                            <Button 
                                className ={classes.googleButton}
                                color = "primary" 
                                fullWidth
                                onClick = {renderProps.onClick}
                                disabled = {renderProps.disabled}
                                startIcon = {<FcGoogle/>}
                                variant = "contained"
                            >
                             SIGN IN WITH GOOGLE
                            </Button>
                        )}
                        onSuccess = {googleSuccess}
                        onFailure = {googleFailure}
                        cookiePolicy = {'single_host_origin'}
                    />
                    <Grid container justify = "flex-end">
                        <Grid item>
                            <Button onClick ={switchMode}>
                            {
                                isSignup ? 'Already have an account ? SIGN IN' : "Don't have an account ? SIGN UP"
                            }
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
       </Container>
    )
}
