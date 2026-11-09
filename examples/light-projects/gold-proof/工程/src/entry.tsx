import {Composition,registerRoot} from 'remotion';
import {TwoControls} from './TwoControls';
import timing from './timing.json';
registerRoot(()=> <Composition id="two-controls" component={TwoControls} durationInFrames={timing.frames} fps={30} width={1080} height={1920}/>);
