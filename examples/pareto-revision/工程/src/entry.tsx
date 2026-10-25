import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Chapter} from './Chapter';
import timing from './timing.json';
import {CaptionProbe} from './CaptionProbe';
const ObservedChapter:React.FC<{captions?:boolean}>=(props)=><><Chapter {...props}/><CaptionProbe/></>;
const Root=()=> <><Composition id="chapter" component={ObservedChapter} durationInFrames={timing.frames} fps={30} width={1080} height={1920} defaultProps={{captions:true}}/><Composition id="clean" component={ObservedChapter} durationInFrames={timing.frames} fps={30} width={1080} height={1920} defaultProps={{captions:false}}/></>;
registerRoot(Root);
