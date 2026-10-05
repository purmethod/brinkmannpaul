import {Composition} from 'remotion';
import {TestFiguren} from './TestFiguren';

export const Root: React.FC = () => (
  <Composition
    id="TestFiguren"
    component={TestFiguren}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1080}
  />
);
