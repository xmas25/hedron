export function clockPulse (bpm, bpmCalcIgnore) {
  return {
    type: 'CLOCK_PULSE',
    payload: {
      bpm, bpmCalcIgnore
    }
  }
}

export function clockBeatInc () {
  return {
    type: 'CLOCK_BEAT_INC'
  }
}

export function clockBpmUpdate (bpm) {
  return {
    type: 'CLOCK_BPM_UPDATE',
    payload: {
      bpm
    }
  }
}

export function clockReset () {
  return {
    type: 'CLOCK_RESET'
  }
}

export function clockGeneratedToggle () {
  return {
    type: 'CLOCK_GENERATED_TOGGLE'
  }
}
