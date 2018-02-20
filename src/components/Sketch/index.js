import React from 'react'
import PropTypes from 'prop-types'
import SketchParam from '../../containers/SketchParam'
import Shot from '../../containers/Shot'
import Button from '../Button'
import ViewHeader from '../ViewHeader'
import ViewSubheader from '../ViewSubheader'
import Items from '../Items'
import Item from '../Item'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
`

const Bottom = styled.div`
  margin-top: auto;
  padding-top: 3rem;
  text-align: right;
`

const Sketch = ({ title, params, shots, onDeleteClick, sketchId }) => (
  <Wrapper>
    <ViewHeader>{title}</ViewHeader>

    {params.length > 0 &&
      <div>
        <ViewSubheader>Params</ViewSubheader>
        <Items>
          {params.map((id, index) => (
            <Item key={id}>
              <SketchParam nodeId={id} index={index} sketchId={sketchId} />
            </Item>
          ))}
        </Items>
      </div>
    }

    {shots.length > 0 &&
      <div>
        <ViewSubheader>Shots</ViewSubheader>
        <Items>
          {shots.map((id, index) => (
            <Item key={id}>
              <Shot nodeId={id} index={index} />
            </Item>
          ))}
        </Items>
      </div>
    }

    <Bottom>
      <Button onClick={onDeleteClick}>Delete Sketch</Button>
    </Bottom>
  </Wrapper>
)

Sketch.propTypes = {
  title: PropTypes.string.isRequired,
  sketchId: PropTypes.string.isRequired,
  params: PropTypes.arrayOf(
    PropTypes.string
  ).isRequired,
  shots: PropTypes.arrayOf(
    PropTypes.string
  ).isRequired,
  onDeleteClick: PropTypes.func.isRequired

}

export default Sketch