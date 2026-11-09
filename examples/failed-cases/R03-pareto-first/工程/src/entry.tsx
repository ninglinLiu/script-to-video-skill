import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Film} from './Film';
import profile from './profile.json';
import plan from '../../plans/edit-plan.json';
registerRoot(()=> <Composition id="film" component={Film} durationInFrames={Math.round(plan.duration*plan.fps)} fps={plan.fps} width={profile.width} height={profile.height}/>);
