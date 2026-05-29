---
title: StreamMESH
slug: streammesh
sort_order: 3
section: projects
status: published
authored_by: desk-projects-writer
reviewed_by: null
created: 2026-05-27T22:15:00Z
published: 2026-05-27T22:15:00Z
revision: 1
tags: [streaming, video, ux, browser-extension, multi-stream, pip]
project_name: StreamMESH
project_status: active
tagline: "A viewer interface built entirely for the viewer — watch content side-by-side across streaming services and live platforms, your way"
problem: "Every streaming platform assumes it owns your screen. The viewer has no way to watch content side-by-side across different services, mix a live stream with a VOD, or set a layout that persists across sessions. The viewer experience is designed by platform business logic, not by what the viewer actually wants."
approach: "Build the interface the platforms won't. A browser-based viewer that treats multiple streams as composable elements: side-by-side, PiP, split-screen, or any combination. The viewer configures the layout. The layout persists. Platform boundaries disappear."
stack: ["TypeScript", "WebExtension API", "CSS Grid", "Picture-in-Picture API", "vanilla JS"]
links: []
metrics: []
embed_url: "/videos/streammesh-demo.webm"
embed_note: "Interface walkthrough — layout switching, channel entry, share flow"
postmortem_notes: null
---

The way most people watch streaming video is a compromise. They want to watch two things at once—a game and a stream, two episodes of different shows, a live event and a replay—and they end up with two browser windows in a layout that requires constant manual adjustment, breaks every time a tab becomes active, and resets completely on every session.

The platforms won't fix this. For each platform, the viewer being on their screen and only their screen is the point. Multi-stream viewing, by definition, means sharing screen time with a competitor.

StreamMESH starts from a different premise: the viewer's screen belongs to the viewer.

## What the interface does

The core idea is treating streams as composable layout elements rather than fixed pages. A viewer opens StreamMESH, adds streams from any combination of services—Twitch, YouTube, Netflix, whatever the browser can render—and arranges them. The arrangement is the product.

**Side-by-side.** Two streams, split down the middle. Equal weight. No primary, no secondary—just two things the viewer wants to watch at the same time. The split is adjustable; drag the divider to rebalance however makes sense for the content.

**Picture-in-picture.** One stream is primary, another floats. PiP follows the viewer as they scroll, persists across tabs, and snaps back to its last position when dismissed and reopened. This is the natural layout when one stream is foreground and another is ambient—a game going in PiP while a long-form video is primary, or a live event in PiP while you're doing something else entirely.

**Split-screen with more than two.** Three or four streams, grid layout. The viewer controls which streams appear where. This is the layout for watching multiple live streams simultaneously—a multi-POV live event, several concurrent matches, or a mix of live and archived content.

**Cross-platform by design.** The viewer doesn't care that one stream is on Twitch and another is on YouTube. StreamMESH doesn't either. The interface treats the URL as the source and lets the browser handle the rendering. Platform-specific features that require native apps (exclusive content, DRM-heavy formats) have the same limitations here that they'd have in any third-party context, but anything the browser can play, StreamMESH can compose.

## The belief behind it

The dominant model in streaming UX is that the viewer is a passive recipient: sit here, watch this thing, engage with our interface. The design choices that follow from that model are everywhere—autoplay that overrides viewer intent, full-screen layouts that resist multitasking, recommendation surfaces that want to redirect attention rather than support what the viewer already chose to do.

StreamMESH is built on the opposite belief: the viewer knows what they want to watch, and the interface should get out of the way and help them watch it. Layout control belongs to the viewer. Session state belongs to the viewer. The platforms are content sources, not experience owners.

This is not a subtle design philosophy. It has concrete consequences for what gets built and what doesn't: no recommendations, no engagement metrics, no dark patterns around session length. Just the content the viewer chose, in the arrangement they configured, persistent across sessions.

## What's in progress

The browser extension architecture is the right deployment model—the viewer gets the interface on top of the existing browser environment without installing a separate application, and the extension can persist layout state across sessions using browser storage.

The PiP implementation uses the browser's native Picture-in-Picture API where available, with a fallback to an overlay layer for platforms that intercept or block the native API. Most major platforms do something in this space; the workaround layer exists for that reason.

Multi-stream audio routing is the open problem. When two streams are playing simultaneously, the default behavior is both playing audio at full volume. A proper mixer—viewer-controlled per-stream volume, mute-by-click, independent levels—is part of the design but not yet shipped in a form I'm happy with.

Layout persistence across sessions uses browser extension storage with a simple JSON schema: stream URL, position, volume, last-active timestamp. The schema is intentionally flat; the goal is something human-readable that can be edited directly if the extension UI ever gets in the way.

## What I believe the viewer interface looks like

The right viewer interface is not the one the platforms would build if they were trying to help you. It is not an aggregator with curated recommendations and a unified content graph. It is much simpler than that: a compositor. URLs in, layout out. The viewer controls both.

The platforms will eventually build something in this space, and when they do it will be designed around their content and their engagement metrics. StreamMESH is built around the viewer's attention and the viewer's choices. Those are different products even if they look similar.
