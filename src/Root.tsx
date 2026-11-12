import React from 'react';
import {Composition} from 'remotion';
import {Episode, EpisodeData, totalFrames, FPS} from './Episode';
import ep1 from '../episodes/ep1.json';

const sample = ep1 as unknown as EpisodeData;

export const Root: React.FC = () => (
  <Composition
    id="Glance"
    component={Episode}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={totalFrames(sample)}
    defaultProps={{data: sample}}
    calculateMetadata={({props}) => ({durationInFrames: totalFrames(props.data)})}
  />
);
