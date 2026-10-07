# SignalPass V3 — A reason to reply

Two narrated films refreshed with October 7 production rehearsal captures.

- **Technical demo:** approximately 2 minutes 53 seconds, under the 3-minute submission limit.
- **Product pitch:** approximately 1 minute 51 seconds, under the 2-minute submission limit.
- **Format:** 1920 × 1080, H.264 video, AAC stereo, English burned-in captions plus SRT sidecars.
- **Voice:** reused generic synthesized English narration from the previously published V2 films. It is not a recording or imitation of Bojack.
- **Edit:** deliberately held views of current product screens, enlarged exact evidence quotes, consistent Alice/Bob role labels, and explanatory title cards. This is an edited presentation of production captures, not an uninterrupted screen recording.

## What the film demonstrates

Alice needs wallet-onboarding usability feedback. Bob's public offer explicitly covers that work. The current production AI suggests Bob and drafts a private introduction. Alice edits its next step, reviews the exact message and sends without a bond. Bob accepts, and both people separately choose to share a fictional contact option.

The production rehearsal used fictional test accounts, 2 real AI requests, and no blockchain transactions. The profiles and contact options were cleaned up afterward. This establishes workflow behavior; it does not establish user adoption or recommendation quality across a wider population.

The additional refinement shot is the real refinement form captured after a successful match. The film does not portray it as a recorded unsuccessful search.

## Monad evidence

The bond scene is labeled **Historical mainnet tests**, separately from the Alice/Bob rehearsal. Its 0.000075 MON bond and acceptance/decline refund receipts come from the earlier test record; the root task rechecked all four transaction receipts on October 7. Both outcomes returned the principal. Network gas is separate. No claim is made that the bond has been shown to reduce spam or improve replies.

The current evidence page is intended at `/v4/evidence.html`; the wallet-free guided sample is intended at `/v4/walkthrough.html`. The latter is clearly fictional and separate from live AI.

## Rebuild

The editable ZIP contains `render.py`, `timeline.json`, the original V2 audio/video sources used for narration, current screenshot assets, captions, and the generated preview boards. Install Python 3 with Pillow, FFmpeg, and the Nimbus Sans / P052 / DejaVu Sans Mono system fonts referenced at the top of render.py. Run:

```sh
python3 render.py --film both
```

`timeline.json` is the authoritative edit decision list. Each event records the source audio interval, actual screenshot name/crop, role label and authored explanatory callout. The renderer never rewrites text inside a product screenshot.

Changing narration requires regenerating or recording the corresponding audio and caption timings. Keep clips comfortably below the submission maximum after any edit.
