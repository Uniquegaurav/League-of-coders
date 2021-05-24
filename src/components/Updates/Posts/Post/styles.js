import { makeStyles } from '@material-ui/core/styles';

export default makeStyles({

  media: {
    height: '180px',
  },

  fullmedia : {
    height: '100%',
  },

  border: {
    border: 'solid',
  },
  fullHeightCard: {
    height: '100%',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: '15px',
    height: '100%',
    position: 'relative',
  },
  tagdesign :{
    fontSize : '15px',
    textDecoration : 'none',
    color : 'DarkGoldenRod',
  },
  postBodyContainer  :{
    maxHeight : '220px',
  },
  messageBoxDesign :{
    maxHeight : '120px',
    overflowY :'auto',
  },
  overlay: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    color: '#ffff',
    filter: 'brightness(200%)',
  },
  overlay2: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    color: '#ffff',
  },
  grid: {
    display: 'flex',
  },
  details: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '5px',
    marginBottom : '2px',
  },
  title: {
    fontSize : '1.4em',
    fontWeight :'400',
    padding: '0 14px',
  },
  cardActions: {
    padding: '0 16px 10px 16px',
    display: 'flex',
    justifyContent: 'space-between',
  },
});