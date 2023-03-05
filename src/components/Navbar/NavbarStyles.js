import { makeStyles } from '@material-ui/core/styles';
import { deepPurple } from '@material-ui/core/colors';

export default makeStyles((theme) => ({
  appBar: {
    borderRadius: 15,
    margin: '30px 0',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 50px',
  },
  heading: {
    color: 'rgba(0,183,255, 1)',
    textDecoration: 'none',
  },
  image: {
    marginLeft: '15px',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '400px',
  },
  profile: {
    display: 'flex',
    position: 'relative',
    justifyContent: 'space-between',

  },
  userName: {
    display: 'flex',
    alignItems: 'center',
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  purple: {
    color: theme.palette.getContrastText(deepPurple[500]),
    backgroundColor: deepPurple[500],
    cursor: 'pointer',
  },
  logoutbox: {
    position: 'absolute',
    top: '54px',
    right: '-45px',
    zIndex: '-1',
    fontSize: '12px',
    borderRadius: 3,
    background: 'white',
    height: 'auto',
    width: 'auto',
    minWidth: '160px',
    minHeight: '100px',
    padding : '10px',
    paddingTop : '15px',
  },
  buttonLogout: {
    fontSize: '12px',
    fontWeight: 'bold',
    paddingLeft : '25px',
    paddingRight :'25px',
    border: '0.1px solid',
    marginTop : '18px',
    marginBottom : '7px', 
  },
  emailText : {
    fontSize: '12px',
    fontWeight : 'normal',
    color : 'green',
  }
}));