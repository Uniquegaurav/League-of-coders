import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaLinkedin
} from 'react-icons/fa';
import { Button } from '../../globalStyle';
import {
  FooterContainer,
  FooterSubscription,
  FooterSubText,
  FooterSubHeading,
  Form,
  FormInput,
  FooterLinksContainer,
  FooterLinksWrapper,
  FooterLinkItems,
  FooterLinkTitle,
  FooterLink,
  SocialMedia,
  SocialMediaWrap,
  SocialLogo,
  SocialIcon,
  WebsiteRights,
  SocialIcons,
  SocialIconLink,
  FooterAnyText
} from './Footer.elements';
function Footer() {
  return (
    <FooterContainer>

       <FooterLinksContainer>
           <FooterLinksWrapper>
                    <FooterLinkItems>
                          <FooterLinkTitle>Help Us</FooterLinkTitle>
                          <FooterLink to='/feedback'>Bug Report</FooterLink>
                          <FooterLink to='/'>Contribute</FooterLink>
                          <FooterLink to='/feedback'>Join our team</FooterLink>
                          <FooterLink to='/feedback'>How it works</FooterLink>
                    </FooterLinkItems>
                    <FooterLinkItems>
                          <FooterLinkTitle>Social Media</FooterLinkTitle>
                          <FooterLink to='/'>Instagram</FooterLink>
                          <FooterLink to='/'>Facebook</FooterLink>
                          <FooterLink to='/'>Youtube</FooterLink>
                          <FooterLink to='/'>Twitter</FooterLink>
                   </FooterLinkItems>
                    <FooterLinkItems>
                          <FooterLinkTitle>Contact Us</FooterLinkTitle>
                          <FooterLink to='/feedback'>Contact no</FooterLink>
                          <FooterLink to='/'>Mail</FooterLink>
                          <FooterLink to='/'>Discord</FooterLink>
                          <FooterLink to='/feedback'>About Developer</FooterLink>
                    </FooterLinkItems>
           </FooterLinksWrapper>
       </FooterLinksContainer>

      <FooterAnyText>Developer Social Media Handles</FooterAnyText>
      <SocialMedia>
        <SocialMediaWrap>
          <SocialIcons>
            <SocialIconLink href='https://www.facebook.com/gaurav.pragati' target='_blank' aria-label='Facebook'>
              <FaFacebook />
            </SocialIconLink>
            <SocialIconLink href='https://www.instagram.com/ig_xqfunique/' target='_blank' aria-label='Instagram'>
              <FaInstagram />
            </SocialIconLink>
            <SocialIconLink
              href={
                'https://www.youtube.com/watch?v=rYi8dQilDwA&list=RDrYi8dQilDwA&start_radio=1'
              }
              rel='noopener noreferrer'
              target='_blank'
              aria-label='Youtube'
            >
              <FaYoutube />
            </SocialIconLink>
            <SocialIconLink href='https://twitter.com/GauravPragatiS' target='_blank' aria-label='Twitter'>
              <FaTwitter />
            </SocialIconLink>
            <SocialIconLink href='https://www.linkedin.com/in/kumar-gaurav-9bb4b41a0/' target='_blank' aria-label='LinkedIn'>
              <FaLinkedin />
            </SocialIconLink>
          </SocialIcons>
        </SocialMediaWrap>
      </SocialMedia>

        <SocialLogo to='/'>
              <SocialIcon />
              LEAGUE OF CODERS
        </SocialLogo>
        <WebsiteRights>LOC © 2021</WebsiteRights>


        <FooterSubscription>
              <FooterSubHeading>
                  Give a feedback ! Let us know how we can improve your experience
              </FooterSubHeading>
              <Form>
                  {/* <FormInput name='message' type='message' placeholder='message' /> */}
                  <Link to = '/feedback'><Button fontBig>Feedback</Button></Link>
              </Form>
        </FooterSubscription>
  
    </FooterContainer>
  );
}

export default Footer;