import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import theme from '../../utils/theme'
import { Link as LinkComponent } from 'react-router-dom'

const BaseLink = css`
flex: 0 0 20%;
color: white;
padding: 0 0.5rem 0.5rem 0;
text-decoration: none;
text-transform: uppercase;
cursor: pointer;
position: relative;

 > div {
   display: flex;
   align-items: center;
   justify-content: center;
   text-align: center;
   height: 4rem;
   background: black;
   border: 1px solid black;

   ${props => props.isActive && `
     border-color: white;
   `}
 }
`

const Label = styled.span`
  display: block;
  position: absolute;
  bottom: calc(0.5rem + 1px);
  right: calc(0.5rem + 1px);
  padding: 0.25rem;
  background: ${props => theme[`channel${props.children}Color`]};
`

const Link = styled(({ isActive, ...rest }) =>
  <LinkComponent {...rest} />)` ${BaseLink} `
const Button = styled.a` ${BaseLink} `

const SceneThumb = (props) => {
  const Wrapper = props.to ? Link : Button

  return (
    <Wrapper {...props}>
      <div>{props.children}</div>
      {props.channel && <Label>{props.channel}</Label>}
    </Wrapper>
  )
}

SceneThumb.propTypes = {
  to: PropTypes.string,
  children: PropTypes.string.isRequired,
  channel: PropTypes.string
}

export default SceneThumb
