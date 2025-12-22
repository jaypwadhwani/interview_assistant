export type VoiceCommand = 
  | 'skip'
  | 'repeat'
  | 'end'
  | 'pause'
  | 'resume'
  | 'go_back'
  | 'next'
  | 'yes'
  | 'no'
  | null;

export const detectVoiceCommand = (transcript: string): VoiceCommand => {
  const lowerTranscript = transcript.toLowerCase().trim();
  
  // Skip commands
  if (
    lowerTranscript.includes('skip') ||
    lowerTranscript.includes('skip this') ||
    lowerTranscript.includes('skip the question') ||
    lowerTranscript.includes('move on') ||
    lowerTranscript.includes('next question') ||
    lowerTranscript.includes('next')
  ) {
    return 'skip';
  }
  
  // Repeat commands
  if (
    lowerTranscript.includes('repeat') ||
    lowerTranscript.includes('say that again') ||
    lowerTranscript.includes('what was the question') ||
    lowerTranscript.includes('can you repeat')
  ) {
    return 'repeat';
  }
  
  // End/Stop commands
  if (
    lowerTranscript.includes('end') ||
    lowerTranscript.includes('stop') ||
    lowerTranscript.includes('i\'m done') ||
    lowerTranscript.includes('i am done') ||
    lowerTranscript.includes('that\'s all') ||
    lowerTranscript.includes('finish')
  ) {
    return 'end';
  }
  
  // Pause commands
  if (
    lowerTranscript.includes('pause') ||
    lowerTranscript.includes('hold on') ||
    lowerTranscript.includes('wait')
  ) {
    return 'pause';
  }
  
  // Resume commands
  if (
    lowerTranscript.includes('resume') ||
    lowerTranscript.includes('continue') ||
    lowerTranscript.includes('ready')
  ) {
    return 'resume';
  }
  
  // Go back commands
  if (
    lowerTranscript.includes('go back') ||
    lowerTranscript.includes('previous') ||
    lowerTranscript.includes('last question')
  ) {
    return 'go_back';
  }
  
  // Yes
  if (
    lowerTranscript === 'yes' ||
    lowerTranscript === 'yeah' ||
    lowerTranscript === 'yep' ||
    lowerTranscript === 'sure' ||
    lowerTranscript === 'okay' ||
    lowerTranscript === 'ok' ||
    lowerTranscript.includes('i\'m ready') ||
    lowerTranscript.includes('ready')
  ) {
    return 'yes';
  }
  
  // No
  if (
    lowerTranscript === 'no' ||
    lowerTranscript === 'nope' ||
    lowerTranscript === 'nah'
  ) {
    return 'no';
  }
  
  return null;
};

