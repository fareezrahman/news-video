import React from 'react';
import {Composition} from 'remotion';
import {Episode, EpisodeData, totalFrames, FPS} from './Episode';
import ep1 from '../episodes/ep1.json';
import {Market, MarketData, marketFrames, MFPS} from './Market';
import mk from '../episodes/market-sample.json';

const sample = ep1 as unknown as EpisodeData;

const mkSample = mk as unknown as MarketData;

export const Root: React.FC = () => (
  <>
  <Composition
    id="Market"
    component={Market}
    fps={MFPS}
    width={1080}
    height={1920}
    durationInFrames={marketFrames(mkSample)}
    defaultProps={{data: mkSample}}
    calculateMetadata={({props}) => ({durationInFrames: marketFrames(props.data)})}
  />
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
  </>
);
