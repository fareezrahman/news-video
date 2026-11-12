import React from 'react';
import {Composition, getInputProps} from 'remotion';
import {Episode, EpisodeData, totalFrames, FPS} from './Episode';
import ep1 from '../episodes/ep1.json';

const input = getInputProps() as {episode?: EpisodeData};
const data: EpisodeData = (input.episode ?? ep1) as EpisodeData;

export const Root: React.FC = () => (
  <Composition
    id="Berita60"
    component={Episode}
    durationInFrames={totalFrames(data)}
    fps={FPS}
    width={1080}
    height={1920}
    defaultProps={{data}}
  />
);
