import React from 'react';
import { Link } from 'react-router-dom';
import { PrimaryButton } from '../Common_components/Button/PrimaryButton';
import { SecondaryButton } from '../Common_components/Button/SecondaryButtton';
import {
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaLinkedin
} from 'react-icons/fa';
import {
  FooterContainer,
  FooterSubscription,
  FooterSubHeading,
  Form,
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
  FooterAnyText,
  BottomFooter
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

      <FooterAnyText>Our Social Media Handles</FooterAnyText>
      <SocialMedia>
        <SocialMediaWrap>
          <SocialIcons>
            <SocialIconLink href='https://www.facebook.com' target='_blank' aria-label='Facebook'>
              <FaFacebook />
            </SocialIconLink>
            <SocialIconLink href='https://www.instagram.com' target='_blank' aria-label='Instagram'>
              <FaInstagram />
            </SocialIconLink>
            <SocialIconLink
              href={
                'https://www.youtube.com'
              }
              rel='noopener noreferrer'
              target='_blank'
              aria-label='Youtube'
            >
              <FaYoutube />
            </SocialIconLink>
            <SocialIconLink href='https://twitter.com' target='_blank' aria-label='Twitter'>
              <FaTwitter />
            </SocialIconLink>
            <SocialIconLink href='https://www.linkedin.com' target='_blank' aria-label='LinkedIn'>
              <FaLinkedin />
            </SocialIconLink>
          </SocialIcons>
        </SocialMediaWrap>
      </SocialMedia>
      <BottomFooter>
        <SocialLogo to='/'>
          <SocialIcon />
          CODERS LEAGUE
        </SocialLogo>
        <WebsiteRights>CL © 2023</WebsiteRights>

        <Form>
          {/* <FormInput name='message' type='message' placeholder='message' /> */}
          {/* <Link to='/feedback'><SecondaryButton fontBig>Feedback</SecondaryButton></Link> */}
        </Form>
      </BottomFooter>



    </FooterContainer>
  );
}

export default Footer;