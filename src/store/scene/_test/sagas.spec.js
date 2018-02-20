import 'babel-polyfill'
import test from 'tape'
import { call, select, takeEvery, put } from 'redux-saga/effects'
import { watchScene, handleSketchCreate, handleSketchDelete } from '../sagas'
import { getModule, getSketchParamIds, getSketchShotIds } from '../selectors'
import getSketches from '../../../selectors/getSketches'
import { sketchCreate, sketchDelete } from '../../sketches/actions'
import { uNodeCreate, uNodeDelete } from '../../nodes/actions'
import history from '../../../history'

import uid from 'uid'
// import { getProjectData, getProjectFilepath } from '../selectors'
// import { projectLoadSuccess } from '../actions'

test('(Saga) watchScene', (t) => {
  const generator = watchScene()
  t.deepEqual(
    generator.next().value,
    takeEvery('SCENE_SKETCH_CREATE', handleSketchCreate)
  )
  t.deepEqual(
    generator.next().value,
    takeEvery('SCENE_SKETCH_DELETE', handleSketchDelete)
  )
  t.end()
})

test('(Saga) handleSketchCreate', (t) => {
  let moduleObj, uniqueId

  const generator = handleSketchCreate({
    payload: {
      moduleId: 'cubey'
    }
  })

  t.deepEqual(
    generator.next().value,
    call(uid),
    'Generate unique ID for sketch'
  )

  uniqueId = 'SKETCHID'

  t.deepEqual(
    generator.next(uniqueId).value,
    select(getModule, 'cubey'),
    'Get module object'
  )

  moduleObj = {
    defaultTitle: 'Cubey Boy',
    params: [
      {
        title: 'Rotate X',
        defaultValue: 0.1,
        key: 'RotX'
      },
      {
        title: 'Rotate Y',
        defaultValue: 0.5,
        key: 'RotY'
      }
    ],
    shots: [
      {
        title: 'Shapeshift',
        method: 'shapeshift'
      },
      {
        title: 'Explode',
        method: 'explode'
      }
    ]
  }

  t.deepEqual(
    generator.next(moduleObj).value,
    call(uid),
    'Generate unique ID for param'
  )

  uniqueId = 'PARAM1'

  t.deepEqual(
    generator.next(uniqueId).value,
    put(uNodeCreate(uniqueId, {
      title: 'Rotate X',
      key: 'RotX',
      type: 'param',
      id: uniqueId,
      value: 0.1,
      isOpen: false,
      inputLinkIds: []
    })),
    'Dispatch node create action'
  )

  t.deepEqual(
    generator.next(moduleObj).value,
    call(uid),
    'Generate unique ID for param'
  )

  uniqueId = 'PARAM2'

  t.deepEqual(
    generator.next(uniqueId).value,
    put(uNodeCreate(uniqueId, {
      title: 'Rotate Y',
      key: 'RotY',
      type: 'param',
      id: uniqueId,
      value: 0.5,
      inputLinkIds: [],
      isOpen: false
    })),
    'Dispatch node create action'
  )

  t.deepEqual(
    generator.next(moduleObj).value,
    call(uid),
    'Generate unique ID for shot'
  )

  uniqueId = 'SHOT1'

  t.deepEqual(
    generator.next(uniqueId).value,
    put(uNodeCreate(uniqueId, {
      id: uniqueId,
      value: 0,
      type: 'shot',
      title: 'Shapeshift',
      method: 'shapeshift',
      sketchId: 'SKETCHID',
      inputLinkIds: []
    })),
    'Dispatch node create action for shot'
  )

  t.deepEqual(
    generator.next(moduleObj).value,
    call(uid),
    'Generate unique ID for shot'
  )

  uniqueId = 'SHOT2'

  t.deepEqual(
    generator.next(uniqueId).value,
    put(uNodeCreate(uniqueId, {
      id: uniqueId,
      value: 0,
      type: 'shot',
      title: 'Explode',
      method: 'explode',
      sketchId: 'SKETCHID',
      inputLinkIds: []
    })),
    'Dispatch node create action for shot'
  )

  t.deepEqual(
    generator.next(uniqueId).value,
    put(sketchCreate('SKETCHID', {
      title: 'Cubey Boy',
      moduleId: 'cubey',
      paramIds: ['PARAM1', 'PARAM2'],
      shotIds: ['SHOT1', 'SHOT2'],
      openedNodes: {}
    })),
    'Dispatch sketch create action'
  )

  t.deepEqual(
    generator.next().value,
    call([history, history.push], '/sketches/view/SKETCHID'),
    'Change location to newly created sketch'
  )

  t.equal(generator.next().done, true, 'Generator ends')

  t.end()
})

test('(Saga) handleSketchCreate (no params or shots)', (t) => {
  let moduleObj, uniqueId

  const generator = handleSketchCreate({
    payload: {
      moduleId: 'cubey'
    }
  })

  t.deepEqual(
    generator.next().value,
    call(uid),
    'Generate unique ID for sketch'
  )

  uniqueId = 'SKETCHID'

  t.deepEqual(
    generator.next(uniqueId).value,
    select(getModule, 'cubey'),
    'Get module object'
  )

  moduleObj = {
    defaultTitle: 'Cubey Boy'
  }

  t.deepEqual(
    generator.next(moduleObj).value,
    put(sketchCreate('SKETCHID', {
      title: 'Cubey Boy',
      moduleId: 'cubey',
      paramIds: [],
      shotIds: [],
      openedNodes: {}
    })),
    'Dispatch sketch create action'
  )

  t.deepEqual(
    generator.next().value,
    call([history, history.push], '/sketches/view/SKETCHID'),
    'Change location to newly created sketch'
  )

  t.equal(generator.next().done, true, 'Generator ends')

  t.end()
})

test('(Saga) handleSketchDelete', (t) => {
  const generator = handleSketchDelete({
    payload: {
      id: 'XXX'
    }
  })

  t.deepEqual(
    generator.next().value,
    select(getSketchParamIds, 'XXX'),
    'Get param Ids'
  )

  const paramIds = ['P1', 'P2']

  t.deepEqual(
    generator.next(paramIds).value,
    put(uNodeDelete('P1')),
    'Dispatch param delete action'
  )

  t.deepEqual(
    generator.next().value,
    put(uNodeDelete('P2')),
    'Dispatch param delete action'
  )

  t.deepEqual(
    generator.next().value,
    select(getSketchShotIds, 'XXX'),
    'Get shot Ids'
  )

  const shotIds = ['S1', 'S2']

  t.deepEqual(
    generator.next(shotIds).value,
    put(uNodeDelete('S1')),
    'Dispatch node delete action for shot'
  )

  t.deepEqual(
    generator.next().value,
    put(uNodeDelete('S2')),
    'Dispatch node delete action for shot'
  )

  t.deepEqual(
    generator.next().value,
    put(sketchDelete('XXX')),
    'Dispatch sketch delete action'
  )

  t.deepEqual(
    generator.next().value,
    select(getSketches),
    'Get remaining sketches'
  )

  const sketches = {
    xxx: {},
    yyy: {}
  }

  t.deepEqual(
    generator.next(sketches).value,
    call([history, history.push], '/sketches/view/yyy'),
    'Change location to latest sketch'
  )

  t.equal(generator.next().done, true, 'Generator ends')

  t.end()
})