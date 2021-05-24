import { makeStyles } from '@material-ui/core/styles';

export default makeStyles((theme) => ({
  mainContainer: {
    display: 'flex',
    alignItems: 'strtch',
    flexDirection : 'row-reverse',
    flexWrap : 'wrap-reverse',
  },
  singlePostContainer : {
    height: '400px',
  },
  smMargin: {
    margin: theme.spacing(1),
  },
  actionDiv: {
    textAlign: 'center',
  },
}));