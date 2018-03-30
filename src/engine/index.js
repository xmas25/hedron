import { loadSketches } from '../externals/sketches'
import getSketch from '../selectors/getSketch'
import getScenes from '../selectors/getScenes'
import getSketchParams from '../selectors/getSketchParams'
import getCurrentScene from '../selectors/getCurrentScene'
import { availableModulesReplaceAll } from '../store/availableModules/actions'
import { projectError } from '../store/project/actions'
import now from 'performance-now'
import * as renderer from './renderer'
import Scene from './Scene'

export let scenes = {}

let sketches = {}
let modules = {}
let isRunning = false
let allModules = {}
let sketchesFolder
let store

export const loadSketchModules = (url) => {
  try {
    sketchesFolder = url
    allModules = loadSketches(url)

    Object.keys(allModules).forEach((key) => {
      const config = allModules[key].config
      modules[key] = config
    })
  } catch (error) {
    console.error(error)
    store.dispatch(projectError(`Sketches failed to load: ${error.message}`, {
      popup: 'true',
      type: 'badSketchFolder'
    }))
  }
}

export const addScene = (sceneId) => {
  scenes[sceneId] = new Scene()
  renderer.setSize()
}

export const removeScene = (sceneId) => {
  delete scenes[sceneId]
}

export const addSketchToScene = (sceneId, sketchId, moduleId) => {
  const meta = {
    sketchesFolder: `file://${sketchesFolder}`
  }

  const scene = scenes[sceneId]
  const module = new allModules[moduleId].Module(scene, meta)

  sketches[sketchId] = module
  scene.scene.add(module.root)
}

export const removeSketchFromScene = (sceneId, sketchId) => {
  const sketch = sketches[sketchId]
  scenes[sceneId].scene.remove(sketch.root)
  delete sketches[sketchId]
}

export const fireShot = (sketchId, method) => {
  const state = store.getState()
  sketches[sketchId][method](getSketchParams(state, sketchId))
}

export const initiateScenes = () => {
  const state = store.getState()
  const stateScenes = getScenes(state)

  // Clear scenes and sketches
  scenes = {}
  sketches = {}

  // Add new ones
  stateScenes.forEach((scene) => {
    addScene(scene.id)
    scene.sketchIds.forEach(sketchId => {
      const moduleId = getSketch(state, sketchId).moduleId
      addSketchToScene(scene.id, sketchId, moduleId)
    })
  })
}

export const run = (injectedStore, stats) => {
  let tick = 0
  let oldTime = now()
  let elapsedFrames = 1
  let delta
  let newTime
  let stateScene
  let sketch
  store = injectedStore
  isRunning = true
  renderer.initiate(injectedStore, scenes)
  // Give store module params
  store.dispatch(availableModulesReplaceAll(modules))

  const loop = () => {
    if (isRunning) {
      requestAnimationFrame(loop)
    }
    const state = store.getState()
    const spf = 1000 / state.settings.throttledFPS
    const allParams = getSketchParams(state)

    newTime = now()
    delta = newTime - oldTime
    elapsedFrames = delta / spf
    tick += elapsedFrames
    oldTime = newTime - (delta % spf)

    if (delta > spf || state.settings.throttledFPS >= 60) {
      stats.begin()
      stateScene = getCurrentScene(state)
      if (stateScene) {
        stateScene.sketchIds.forEach(sketchId => {
          sketch = sketches[sketchId]
          const params = getSketchParams(state, sketchId)
          sketch.update(params, tick, elapsedFrames, allParams)
        })
        renderer.render(scenes[stateScene.id])
      }

      stats.end()
    }
  }
  loop()
}

export const pause = () => {
  isRunning = false
}
