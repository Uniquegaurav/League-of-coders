import { makeStyles } from '@material-ui/core/styles';

export default makeStyles(() => ({
  topMainBox : {
    height: 'auto',
    minHeight : '90vh',
    background: '#a8c0ff',  /* fallback for old browsers */
    background: '-webkit-linear-gradient(to right, #3f2b96, #a8c0ff)',  /* Chrome 10-25, Safari 5.1-6 */
    background: 'linear-gradient(to right, #3f2b96, #a8c0ff)', /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */ 
  },
  appBar: {
    borderRadius: 15,
    margin: '24px 0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    color: 'rgba(0,183,255, 1)',
  },
  image: {
    marginLeft: '15px',
  },
  divclass : {
    width : 'auto',
    paddingTop : '40px',
    marginRight : '21%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  contentsContainer : {
    display : 'contents',
  },
}));