import {Composition,registerRoot} from 'remotion';
import {FullFilm} from './FullFilm';
import timing from './timing.json';
const Root=()=> <Composition id="gold-transmission" component={FullFilm} durationInFrames={timing.frames} fps={30} width={1080} height={1920}/>;
registerRoot(Root);
