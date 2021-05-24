import React from 'react'
import { Typography, Paper } from '@material-ui/core';
const Error1 = ({msg}) => {
    const style = {
        width : 'auto',
        height : 'auto',
        minWidth : '30%',
        minHeight : '20%',
       display : 'flex',
       alignItems : 'center',
       justifyContent : 'center'
    };
    const style2 = {
        minWidth : '32%',
        width : 'auto',
        height : '100px',
        display : 'flex',
        alignItems : 'center',
        justifyContent : 'center',
        boxShadow: 'rgba(255, 255, 255, 0.1) 0px 1px 1px 0px inset, rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px'
    };
    return (
        <div style = {style}>        
            <Paper style = {style2} className>
               <Typography  color = 'textPrimary' variant ="h6" align ="center">
                        {msg}
               </Typography>
            </Paper>
        </div>
    )
}

export default Error1
