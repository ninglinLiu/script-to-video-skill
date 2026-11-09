import {Composition,registerRoot} from 'remotion';
import {Film} from './Film';
import timing from './timing.json';
const Root=()=> <Composition id="index-machine" component={Film} durationInFrames={timing.frames} fps={30} width={1080} height={1920}/>;
registerRoot(Root);
