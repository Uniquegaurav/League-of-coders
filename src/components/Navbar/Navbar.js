import React, { useEffect, useState } from 'react'
import './Navbar.css'
import {FaBars} from 'react-icons/fa'
import { SecondaryButton } from '../Common_components/Button/SecondaryButtton'
import { FaTimes } from 'react-icons/fa'
import {IconContext} from 'react-icons/lib'
import Avatar from '@material-ui/core/Avatar';
import { Typography ,Button as Button2, Box } from '@material-ui/core/'
import useStyles from './NavbarStyles';
import {useHistory ,useLocation} from 'react-router-dom';
import decode from 'jwt-decode';


import { MobileIcon, 
    Nav, NavbarContainer, NavBtnLink,
     NavIcon, NavItemBtn,
    NavItems, NavLinks, NavLogo,
    NavMenu
} from './Navbar.elements'
import { useDispatch } from 'react-redux'

const Navbar = () => {
    const [click, setclick] = useState(false);
    const handleClick = () => setclick(!click);
    const [button, setbutton] = useState(true)
    const classes = useStyles();

    const showButton = () =>{
        if(window.innerWidth <=960){
            setbutton(false);
        }else{
            setbutton(true);
        }
    }
    useEffect(() => {
       showButton()
    }, [])
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('profile')));

    const dispatch = useDispatch();
    const history = useHistory();
    const [profileClick, setprofileClick] = useState(false)
    const location = useLocation();

    const logout = () =>{
        dispatch({type : 'LOGOUT'})
        history.push('/');
        window.location.reload(); 
        setUser(null);
        setprofileClick(!profileClick)
    }
     useEffect(() => {
        const token = user?.token;
        // jWT ...
        if(token){
            const decodeToken = decode(token);
            if(decodeToken.exp*1000 < new Date().getTime()){
                logout();
            }
        }
        setUser(JSON.parse(localStorage.getItem('profile')))
    }, [location])

    window.addEventListener('resize' ,showButton);
    return (
        <>
          <IconContext.Provider value = {{color :'#ffff'}}>
                <Nav>
                    <NavbarContainer>
                        <NavLogo to = "/">
                            <NavIcon/>
                            CODERS LEAGUE
                        </NavLogo>
                        <MobileIcon onClick = {handleClick}>
                            {click ? <FaTimes/> : <FaBars/>}
                        </MobileIcon>
                        <NavMenu onClick = {handleClick} click ={click}>
                            <NavItems>
                                <NavLinks to ='/'>HOME</NavLinks>
                            </NavItems>
                            <NavItems>
                                <NavLinks to ='/compete'>COMPETE</NavLinks>
                            </NavItems>
                            <NavItems>
                                <NavLinks to ='/problems'>PROBLEMS</NavLinks>
                            </NavItems>
                            <NavItems>
                                <NavLinks to ='/updates'>UPDATES</NavLinks>
                            </NavItems>
                            { user ? <div className = {classes.profile}>
                                          <Avatar className = {classes.purple} 
                                                alt = {user.result.name}
                                                src = {user.result.imageUrl}
                                                onClick = {() => setprofileClick(!profileClick)}
                                                >{user.result.name.charAt(0)}</Avatar>

                                          <Box className={classes.logoutbox} display = {profileClick ? "block" : "none"}>
                                              <Typography  variant="body2">{user.result.name}</Typography>
                                              <Typography className={classes.emai} >{user.result.email}</Typography>
                                              <Button2 className = {classes.buttonLogout} onClick={logout}>LOGOUT</Button2>
                                          </Box>
                                        </div>
                                 : <NavItemBtn>
                                    { button ? (
                                        <NavBtnLink to = "/sign-up">
                                            <SecondaryButton primary>SIGN IN</SecondaryButton>
                                        </NavBtnLink>
                                    ):(
                                        <NavBtnLink to = "/sign-up">
                                            <SecondaryButton fontBig primary> SIGN IN</SecondaryButton>
                                        </NavBtnLink>
                                    )}
                                </NavItemBtn>
                           }   
                        </NavMenu>
                    </NavbarContainer>
                </Nav>
            </IconContext.Provider>
        </>
    )
}

export default Navbar
