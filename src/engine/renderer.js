const { THREE, postprocessing } = window.HEDRON.dependencies
const { EffectComposer, RenderPass } = postprocessing

import uiEventEmitter from '../utils/uiEventEmitter'
import * as engine from './'
import QuadScene from './QuadScene'

import getScenes from '../selectors/getScenes'

let store, domEl, outputEl, viewerEl, isSendingOutput, rendererWidth, rendererHeight,
  previewCanvas, previewContext, outputCanvas, outputContext

let quadScene, quadMixUniform, rttA, rttB
let delta

export let renderer, composer, mainPass

export const setRenderer = () => {
  renderer = new THREE.WebGLRenderer({
    antialias: false, // antialiasing should be handled by the composer
  })

  domEl = renderer.domElement
  viewerEl.innerHTML = ''
  viewerEl.appendChild(domEl)
  const renderTargetParameters = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat,
    stencilBuffer: false,
  }
  rttA = new THREE.WebGLRenderTarget(null, null, renderTargetParameters)
  rttB = new THREE.WebGLRenderTarget(null, null, renderTargetParameters)

  quadScene = new QuadScene(rttA, rttB)
  quadMixUniform = quadScene.material.uniforms.mixRatio

  composer = new EffectComposer(renderer)
}

export const setPostProcessing = () => {
  const state = store.getState()
  const stateScenes = getScenes(state)

  composer.reset()

  mainPass = new RenderPass(quadScene.scene, quadScene.camera)
  mainPass.renderToScreen = true
  composer.addPass(mainPass)

  const passes = []

  stateScenes.forEach(scene => {
    scene.sketchIds.forEach(sketchId => {
      const module = engine.sketches[sketchId]
      // Do any postprocessing related setup for this sketch
      if (scene.settings.globalPostProcessingEnabled && module.initiatePostProcessing) {
        const pass = module.initiatePostProcessing({ composer })
        // If sketch has an output pass, add to array
        if (pass) passes.push(pass)
      }
    })
  })

  // Set last item of output passes to render to the screen
  if (passes.length) {
    mainPass.renderToScreen = false
    passes[passes.length - 1].renderToScreen = true
  }
}

export const setViewerEl = (el) => {
  viewerEl = el
}

export const setSize = () => {
  const settings = store.getState().settings
  let width, ratio

  if (isSendingOutput) {
    // Get width and ratio from output window
    width = outputEl.offsetWidth
    ratio = width / outputEl.offsetHeight

    previewCanvas.width = width
    previewCanvas.height = width / ratio

    outputCanvas.width = width
    outputCanvas.height = width / ratio

    composer.setSize(viewerEl.offsetWidth, viewerEl.offsetWidth / ratio)
  } else {
    // Basic width and ratio if no output
    width = viewerEl.offsetWidth
    ratio = settings.aspectW / settings.aspectH
  }

  const perc = 100 / ratio
  const height = width / ratio

  composer.setSize(width, height)

  // Set sizes for render targets
  rttA.setSize(width, height)
  rttB.setSize(width, height)

  // Set sizes for quad scene
  quadScene.setSize(width, height)

  // Set ratios for each scene
  const engineScenes = engine.scenes
  for (const key in engineScenes) {
    engineScenes[key].setRatio(ratio)
  }

  rendererWidth = width
  rendererHeight = height

  // CSS trick to resize canvas
  viewerEl.style.paddingBottom = perc + '%'
}

export const initiate = (injectedStore) => {
  store = injectedStore

  uiEventEmitter.on('repaint', () => {
    setSize()
  })

  setRenderer()
  setSize()
}

export const setOutput = (win) => {
  stopOutput()
  const container = win.document.querySelector('div')

  rendererHeight = container.offsetWidth
  rendererWidth = container.offsetHeight
  outputEl = container

  // Move renderer canvas to new window
  outputEl.appendChild(domEl)
  domEl.setAttribute('style', '')

  // Setup output canvas
  // If preview and output are different, this canvas will be used and
  // renderer renders two different images, with images being copied from
  // the dom element to both preview and output canvases
  outputCanvas = document.createElement('canvas')
  outputCanvas.style = 'position: absolute; left: 0; top:0; height: 0; width:100%; height:100%;'
  outputContext = outputCanvas.getContext('2d')
  outputEl.appendChild(outputCanvas)

  // Setup preview canvas in dom
  // Pixels will be copied from renderer dom element to this
  previewCanvas = document.createElement('canvas')
  previewCanvas.style = 'position: absolute; left: 0; top:0; height: 0; width:100%; height:100%;'
  previewContext = previewCanvas.getContext('2d')
  viewerEl.appendChild(previewCanvas)

  isSendingOutput = true

  setSize()

  win.addEventListener('resize', () => {
    uiEventEmitter.emit('repaint')
  })
}

export const stopOutput = () => {
  viewerEl.innerHTML = ''
  domEl.setAttribute('style', '')
  viewerEl.appendChild(domEl)

  isSendingOutput = false

  setSize()
}

const renderChannels = (sceneA, sceneB, mixRatio) => {
  renderer.setRenderTarget(rttA)
  renderer.clear()
  if (sceneA) {
    renderer.render(sceneA.scene, sceneA.camera)
  }

  renderer.setRenderTarget(rttB)
  renderer.clear()
  if (sceneB) {
    renderer.render(sceneB.scene, sceneB.camera)
  }

  quadMixUniform.value = mixRatio
  composer.render(delta)
}

const renderSingle = (scene, rtt, mixRatio) => {
  if (scene) {
    renderer.setRenderTarget(rtt)
    renderer.clear()
    renderer.render(scene.scene, scene.camera)
  }

  quadMixUniform.value = mixRatio
  composer.render(delta)
}

const renderLogic = (sceneA, sceneB, viewerMode, mixRatio) => {
  switch (viewerMode) {
    case 'A':
      renderSingle(sceneA, rttA, 0)
      break
    case 'B':
      renderSingle(sceneB, rttB, 1)
      break
    default:
      renderChannels(sceneA, sceneB, mixRatio)
  }
}

const copyPixels = (context) => {
  context.drawImage(renderer.domElement, 0, 0, rendererWidth, rendererHeight)
}

export const render = (sceneA, sceneB, mixRatio, viewerMode, deltaIn) => {
  delta = deltaIn

  // mixState helps with performance. If mixer is all the way to A or B
  // we can stop rendering of opposite channel
  let mixState = 'mix'
  if (mixRatio === 0) {
    mixState = 'A'
  } else if (mixRatio === 1) {
    mixState = 'B'
  }

  if (!isSendingOutput) {
    // Always using dom element when not outputting
    if (previewCanvas) previewCanvas.style.display = 'none'
    if (viewerMode === 'mix') {
      renderLogic(sceneA, sceneB, mixState, mixRatio)
    } else {
      renderLogic(sceneA, sceneB, viewerMode, mixRatio)
    }
  } else {
    // When outputting, need the preview canvas
    if (previewCanvas) previewCanvas.style.display = 'block'
    // mix and preview viewer are the same
    if (viewerMode === 'mix' || mixState === viewerMode) {
      // No need for output canvas
      outputCanvas.style.display = 'none'
      // Render the correct thing
      renderLogic(sceneA, sceneB, mixState, mixRatio)
      // Copy pixels to preview
      copyPixels(previewContext)
    } else {
      // mix and preview are not the same
      // Show output canvas
      outputCanvas.style.display = 'block'

      // Render for output
      renderLogic(sceneA, sceneB, mixState, mixRatio)
      // Copy pixels to output canvas
      copyPixels(outputContext)
      // Render for preview
      renderLogic(sceneA, sceneB, viewerMode, mixRatio)
      // Copy pixels to preview canvas
      copyPixels(previewContext)
    }
  }
}