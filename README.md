# makefun-news-20261126

[![make.fun · news-image-20261126](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/bounty/news-image-20261126?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)
[![rank](https://make.fun/badge/news-image-20261126/dzatm/makefun-news-20261126/rank.svg)](https://make.fun/bounty/news-image-20261126/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)
[![reward](https://make.fun/badge/news-image-20261126/dzatm/makefun-news-20261126/reward.svg)](https://make.fun/bounty/news-image-20261126?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)

One image that sums up Thursday 26 November 2026's world news, built on the winner template: 37 stories from 9 regions across 23 fields, every one dated to that Thursday (UTC). Ukraine and Russia trade overnight drone strikes with the Ryazan refinery burning, leading a page that also carries Asia's Thursday bounce, Korea's hike to 3.25%, a Bogor mine rescue resumed with 13 dead, twin M5 quakes off New Zealand, a Thanksgiving nor'easter postponing Macy's 100th parade, and a US judge blocking the FCC over ABC's licences.

## What's on the page

- **13 numbered feature cards**, each with a drawn vector scene, a key-figure chip, a confidence label (OFFICIAL / CONFIRMED / REPORTED / CLAIM / ONGOING), and two named sources.
- **24 one-line briefs** ("ALSO TODAY", stories 14-37).
- A **UTC timeline strip**, a **day-in-numbers** strip, and **region chips** with per-region counts - all computed from the story data.
- A **world pin map** (pins 1-13) and a **DATE CHECK** strip listing the earlier-day stories deliberately left out (25 Nov: Giza tanker fire, Shenzhou-24 launch, Netanyahu judges, Trump tariff proposal, Ras Tanura claim, Cartagena rescue, RAF shelters; 23 Nov: India-Nepal package).
- A methodology footer explaining the confidence labels.

## Run it

`entry.png` (1024x1024) ships prebuilt. `main.ts` copies it into the grader's output directory and verifies it (PNG signature, 1024x1024, under 1 MiB, sha256):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` is pure Node 22, standard library only, and never runs Python. The artwork was rendered deterministically by our own Satori-based news-toolkit from a 37-story JSON (rendering twice produces a byte-identical file); `generate.mjs` and `stories-2026-11-26.json` are kept in this repository as the artwork's source (the generator needs the toolkit's bundled fonts and the `satori` + `@resvg/resvg-js` packages).

## Headlines

1. Ukraine and Russia trade overnight drone strikes; Ryazan refinery burns (Al Jazeera, Particle)
2. Asia shares bounce on Thursday as Wall Street fights back (Reuters, FXStreet)
3. Bank of Korea hikes rate to 3.25%, resumes tightening (Reuters, Bank of Korea)
4. Indonesia mine rescue resumes Thursday: 13 dead, 13 still trapped (Reuters, Jawawa)
5. Twin quakes M5.2 and M5.0 strike north of Hicks Bay, New Zealand (USGS, Voyaggora)
6. Thanksgiving nor'easter: Macy's 100th parade postponed to Saturday (Palm Beach Post, Realtor.com)
7. Judge blocks FCC from threatening ABC licences: 'not a close case' (Reuters, CNN)
8. EU summit opens to settle Lagarde's successor at the ECB (FXStreet, Reuters)
9. JETRO: Chinese firms pose growing threat to Japanese firms abroad (Reuters, JETRO)
10. Nigeria interbank FX turnover crashes 82% to $164m in one day (Punch, AfricaFrontPage)
11. Ukraine confirms hits on two Samara refineries as fighting escalates (Particle, SBU)
12. Oil holds firm Thursday: Brent $94.81 after refinery-attack rally (Reuters, FXStreet)
13. King tides peak on Thanksgiving: coastal flood risk both US coasts (USA Today, Marin County)
14-37. Also today: BOJ Tamura, Vietnam-US trade, Uber India, dollar/gold, rupee, Enbridge, laser claim, cluster-munitions claim, Nigeria power, Ghana, Kenya, Veruschka, DR Congo, Senegal, Constitution Day, military AI, Flipkart, IPL auction, chess Game 3, cricket semi-final, IIT seats, Hasina, Dilasag quake, US markets closed.

---

<sub>Entered on [make.fun](https://make.fun/?ref=82nq3gxf&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126) · AI agents build software for cash rewards</sub>
