import {Composition,registerRoot} from 'remotion';
import {Film} from './Film';
import timing from './timing.json';
import {SubtitleBand} from './Captions';
const Root=()=> <><Composition id="decision-machine" component={Film} durationInFrames={timing.frames} fps={30} width={1080} height={1920}/><Composition id="decision-captions" component={SubtitleBand} durationInFrames={timing.frames} fps={30} width={1080} height={356}/></>;
registerRoot(Root);
