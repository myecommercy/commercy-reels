import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { Reel } from "./Reel";
import timings from "./timings.json";
import { Episode, EpisodeSpec, Timings } from "./clay/Episode";
import { galleryPages, iconPages } from "./kit/gallery";

const FPS = 30;

// every episodes/*.json becomes a composition automatically – no code change for a new video
declare const require: { context: (dir: string, sub: boolean, re: RegExp) => { keys(): string[]; (k: string): unknown } };
const ctx = require.context("../episodes", false, /^\.\/.*\.json$/);
const EPISODES = ctx
  .keys()
  .map((k) => ctx(k) as EpisodeSpec)
  .filter((e) => e && e.id)
  .sort((a, b) => a.id.localeCompare(b.id));

type EpProps = { ep: EpisodeSpec; timings: Timings };

// rough timings from text length, used only when the audio has not been prepared yet
const estimate = (ep: EpisodeSpec): Timings => {
  let t = 0.3;
  const lines = ep.lines.map((l) => {
    const d = Math.max(1.6, l.text.length * 0.075);
    const r = { start: t, end: t + d };
    t += d + 0.45;
    return r;
  });
  const last = ep.lines[ep.lines.length - 1];
  const qi = ep.question ? Math.max(0, last.text.indexOf(ep.question)) : last.text.length;
  const ls = lines[lines.length - 1];
  const voEnd = ls.end;
  return { lines, voEnd, qStart: ls.start + (ls.end - ls.start) * (qi / Math.max(1, last.text.length)), total: voEnd + 3.4, hasAudio: false };
};

const calc: CalculateMetadataFunction<EpProps> = async ({ props }) => {
  let tm: Timings;
  try {
    const res = await fetch(staticFile(`${props.ep.id}/timings.json`));
    if (!res.ok) throw new Error("no timings");
    tm = (await res.json()) as Timings;
  } catch {
    tm = estimate(props.ep);
  }
  return { durationInFrames: Math.ceil(tm.total * FPS), props: { ...props, timings: tm } };
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="PaymentReel" component={Reel} durationInFrames={Math.ceil(timings.total * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="PaymentReelClay" component={Reel} defaultProps={{ clay: true }} durationInFrames={Math.ceil(timings.total * FPS)} fps={FPS} width={1080} height={1920} />
    {EPISODES.map((ep) => (
      <Composition
        key={ep.id}
        id={ep.id}
        component={Episode}
        defaultProps={{ ep, timings: estimate(ep) }}
        calculateMetadata={calc}
        durationInFrames={Math.ceil(estimate(ep).total * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
      />
    ))}
    {[...galleryPages(), ...iconPages()].map((ep) => {
      const tm: Timings = { lines: ep.lines.map((_, i) => ({ start: i * 5, end: i * 5 + 4.6 })), voEnd: ep.lines.length * 5, qStart: 9999, total: ep.lines.length * 5, hasAudio: false };
      return <Composition key={ep.id} id={ep.id} component={Episode} defaultProps={{ ep, timings: tm }} durationInFrames={Math.round(tm.total * FPS)} fps={FPS} width={1080} height={1920} />;
    })}
  </>
);
