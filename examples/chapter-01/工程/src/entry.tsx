import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Chapter} from './Chapter';
import timing from './timing.json';
const Root=()=> <><Composition id="chapter" component={Chapter} durationInFrames={timing.frames} fps={30} width={1920} height={1080} defaultProps={{captions:true}}/><Composition id="clean" component={Chapter} durationInFrames={timing.frames} fps={30} width={1920} height={1080} defaultProps={{captions:false}}/></>;
registerRoot(Root);
