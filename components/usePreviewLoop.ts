import { useEffect, useRef } from "react";

// A seek can land a little before the requested time; don't treat that as leaving the range.
const SEEK_TOLERANCE = 0.5;

/**
 * While `active`, plays the video from `start` and jumps back to `start` whenever it reaches `end`
 * or is moved outside the range. Checked every frame, since `timeupdate` only fires about 4 times
 * a second and would overshoot the end. Stopping (or unmounting) pauses the video. If the user
 * pauses it themselves, `onUserPause` is called so the caller can end the preview.
 */
export default function usePreviewLoop(
  video: HTMLVideoElement,
  start: number | null,
  end: number | null,
  active: boolean,
  onUserPause: () => void,
): void {
  // Read from refs so edits to the range while previewing don't restart (and re-seek) the loop.
  const range = useRef({ start, end });
  const userPause = useRef(onUserPause);
  useEffect(() => {
    range.current = { start, end };
    userPause.current = onUserPause;
  });

  useEffect(() => {
    if (!active) return;
    // During an ad the video element plays the ad, so leave it alone.
    const player = video.closest(".html5-video-player");
    const inAd = () => player?.classList.contains("ad-showing") ?? false;

    if (!inAd() && range.current.start !== null) {
      video.currentTime = range.current.start;
      video.play().catch(() => {});
    }

    // Reaching the very end of the video also pauses it (with `ended` set); the loop restarts that.
    const handlePause = () => {
      if (!video.ended && !inAd()) userPause.current();
    };
    video.addEventListener("pause", handlePause);

    let frame = requestAnimationFrame(function check() {
      const { start, end } = range.current;
      if (start !== null && end !== null && !inAd()) {
        const time = video.currentTime;
        if (time >= end || time < start - SEEK_TOLERANCE) {
          video.currentTime = start;
          if (video.paused) video.play().catch(() => {});
        }
      }
      frame = requestAnimationFrame(check);
    });

    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener("pause", handlePause);
      if (!inAd()) video.pause();
    };
  }, [video, active]);
}
