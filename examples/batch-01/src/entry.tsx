import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Demo} from './Demo';
import {demoIds} from './catalog';
const Root=()=> <>{demoIds.map(id=><Composition key={id} id={id} component={Demo} defaultProps={{id}} durationInFrames={300} fps={30} width={1080} height={1920}/>)}</>;
registerRoot(Root);
