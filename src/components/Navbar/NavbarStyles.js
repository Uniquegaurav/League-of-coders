import { makeStyles } from '@material-ui/core/styles';
import { deepPurple } from '@material-ui/core/colors';
import zIndex from '@material-ui/core/styles/zIndex';

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
    position : 'relative',
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
  },
  logoutbox : {
     position: 'absolute',
     top : '54px',
     right : '-45px',
     zIndex: '-1',
    //  background : 'rgbaa(0,0,0,.1)',
    //  boxShadow : '0 0 5px rgba(0,0,00,5) inset',
    fontSize : '12px',
     background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    //  border: '2px solid ',
     borderRadius: 3,
     color: 'white',
     background : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
     height: 'auto', 
     width : 'auto',
     minWidth : '138px',
     minHeight : '60px',
  },
  buttonLogout : {
    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    fontSize : '14px',
    fontWeight : 'bold',
    background : 'linear-gradient(41deg, #2996F6 56%, #29CBE3 73%)',
    border: '0.1px solid'
    
  }
}));