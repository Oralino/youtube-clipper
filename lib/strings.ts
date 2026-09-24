// Mirrors CONTENT.md. Change the copy there first, then here.
export const STRINGS = {
  clipButton: {
    label: "Clip",
  },
  panel: {
    heading: "Create clip",
    start: "Start",
    end: "End",
    useCurrentTime: "Use current time",
    preview: "Preview",
    stopPreview: "Stop preview",
    copyLink: "Copy link",
    copyEmbedLink: "Copy embed link",
    embedNote: "For friends without the extension. Some videos don't allow embedding.",
    copied: "Copied",
    copiedAnnouncement: "Link copied",
    copyFailed: "Couldn't copy",
    copyManually: "Copy this link manually",
    errorUnreadableTime: "Enter a time like 1:23.",
    errorEndBeforeStart: "End must be after start.",
    errorOutsideVideo: "Time is outside the video.",
    close: "Close",
  },
  popup: {
    watchPageBody: "Clip a section of this video.",
    openPanel: "Open clip panel",
    closePanel: "Close clip panel",
    otherPage: "Open a YouTube video to clip it.",
    needsReload: "Reload this tab to use the extension.",
    reloadTab: "Reload tab",
  },
  playback: {
    indicator: (start: string, end: string) => `Clip · ${start} – ${end}`,
    ended: "Clip ended",
    replay: "Replay",
    watchFullVideo: "Watch full video",
  },
} as const;
