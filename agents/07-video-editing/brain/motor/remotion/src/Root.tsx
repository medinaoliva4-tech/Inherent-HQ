import React from "react";
import { Composition } from "remotion";
import { BRAND, FPS, H, W } from "./brand";
import "./fonts";
import { Reel, REELS, reelDuration } from "./videos/Reel";

// Una composición por reel definido en edit/reels.json → `npx remotion render src/index.ts CLIENTE-V01 out/...`
export const Root: React.FC = () => (
  <>
    {REELS.map((r) => (
      <Composition key={r.id} id={`${BRAND.id}-${r.id}`} component={Reel} defaultProps={{ id: r.id }} durationInFrames={reelDuration(r)} fps={FPS} width={W} height={H} />
    ))}
  </>
);
