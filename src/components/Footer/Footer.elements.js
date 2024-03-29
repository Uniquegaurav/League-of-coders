import styled from 'styled-components';
import { FaBattleNet } from "react-icons/fa";
import { Link } from 'react-router-dom';

export const FooterContainer = styled.div`
  background: #000000; 
  background: -webkit-linear-gradient(to right, #434343, #000000); 
  background: linear-gradient(to right, #434343, #000000); 
  padding: 4rem 0 2rem 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const FooterSubscription = styled.section`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
  padding: 24px;
  color: #fff;
`;

export const FooterSubHeading = styled.p`
  margin-bottom: 22px;
  font-size: 24px;
`;

export const FooterSubText = styled.p`
  margin-bottom: 22px;
  font-size: 20px;
`;

export const FooterAnyText = styled.p`
  margin : 24px;
  margin-bottom : 10px;
  font-size: 20px;
  color : #ffff;
`;

export const Form = styled.form`
  display: flex;
  justify-content: center;
  align-items: center;
  @media screen and (max-width: 820px) {
    flex-direction: column;
    width: 80%;
  }
`;

export const FormInput = styled.input`
  padding: 10px 20px;
  border-radius: 2px;
  margin-right: 10px;
  outline: none;
  border: none;
  font-size: 16px;
  border: 1px solid #fff;
  &::placeholder {
    color: #242424;
  }
  @media screen and (max-width: 820px) {
    width: 100%;
    margin: 0 0 16px 0;
  }
`;

export const FooterLinksContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  display: flex;
  justify-content: center;
  @media screen and (max-width: 820px) {
    padding-top: 31px;
  }
`;

export const FooterLinksWrapper = styled.div`
  display: flex;
  border-bottom: 2px solid white;
  @media screen and (max-width: 820px) {
    flex-direction: column;
    border-bottom: none;
  }
`;

export const FooterLinkItems = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 40px;
  margin-right: 40px;
  margin-bottom: 10px;
  text-align: left;
  width: 160px;
  box-sizing: border-box;
  color: #fff;
  @media screen and (max-width: 420px) {
    margin: 0;
    padding: 10px;
    width: 100%;
  }
`;

export const FooterLinkTitle = styled.h2`
  margin-bottom: 16px;
`;

export const FooterLink = styled(Link)`
  color: #fff;
  text-decoration: none;
  margin-bottom: 0.5rem;
  &:hover {
    color: #0467fb;
    transition: 0.3s ease-out;
  }
`;

export const SocialMedia = styled.section`
  max-width: 1000px;
  width: 100%;
`;

export const SocialMediaWrap = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 90%;
  max-width: 1000px;
  margin: 20px auto 40px auto;
  flex-direction: column;
  @media screen and (max-width: 820px) {
    flex-direction: column;
  }
`;



export const SocialIcon = styled(FaBattleNet)`
  margin-right: 12px;
`;



export const SocialIcons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 240px;
`;
export const SocialIconLink = styled.a`
  color: #fff;
  font-size: 24px;
`;

export const BottomFooter = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

`;
export const SocialLogo = styled(Link)`
  color: #fff;
  cursor: pointer;
  text-decoration: none;
  font-size: 2rem;
  display: flex;
  align-items: center;
`;
export const WebsiteRights = styled.small`
  color: #fff;
  margin-top: 12px;
  padding-left : 5px;  
  padding-right : 50px;
`;
