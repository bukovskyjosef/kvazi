import { punctuation } from './rules-data.mjs';

// Presentation-only edge detection. Surface validity comes exclusively from Phase 1.
export function createSurfaceRewardTracker() {
  let previouslyPassed = false;
  return (draft, state) => {
    const passed = Object.values(punctuation()).includes(draft.closingPunct) && state.sequence.ok;
    const fire = passed && !previouslyPassed;
    previouslyPassed = passed;
    return { passed, fire };
  };
}
