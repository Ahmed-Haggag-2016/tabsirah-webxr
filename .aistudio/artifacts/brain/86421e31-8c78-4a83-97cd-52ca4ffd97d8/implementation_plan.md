# Wrist-Flip Horizon OS Quick Menu & Spatial Polish

Implement a high-craft **Wrist-Flip Quick Menu** (`wrist-flip-quick-menu`) that detects when a user raises and flips their left wrist in WebXR to reveal a floating radial 4-button spatial action ring (Wonder Brush, Cosmic Convergence, Mic Breath, and Stillness Sanctuary) without opening menus or lowering controllers.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Confirmed Feature**: Wrist-Flip Horizon OS Quick Menu selected in Phase 1 clarification.
> - **Zero Clutter**: Keeps the central 3D viewport 100% unobstructed until gesture-activated.

---

## 1. Overview & Core Concept

- **What It Does**: Detects left-hand orientation (palm-up / wrist-flip gesture) in Meta Quest WebXR (`hand-tracking-controls` or controllers) and presents a glowing radial shortcut menu attached to the left wrist.
- **Target Audience / Persona**: Meta VR Start competition judges and VR enthusiasts experiencing Tabsirah in standalone VR/MR.
- **Key Value**: Delivers signature "Horizon OS spatial computing" ergonomics, letting users trigger major grand-prize features with a natural hand gesture.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. User holds left hand up with palm facing inward/upward (wrist flip).
  2. A glowing radial menu (4 icons/buttons: Brush, Converge, Mic, Stillness) animates outward from the wrist.
  3. User taps any button with their right hand index fingertip or laser pointer to trigger the action with instant haptic feedback.
  4. Lowering the wrist or stepping back smoothly fades out the menu.
- **Visual Identity & Theme**:
  - *Aesthetic*: Glassmorphic floating translucent ring with cyan/gold emission matching Tabsirah's theme.
  - *Typography*: Clean tabular monospace labels and iconography.

---

## 3. Key Product Decisions & Trade-Offs

- **Gesture Detection Threshold**: Use quaternion dot product against camera gaze and hand up-vector to avoid false triggers while remaining effortless to invoke.
- **Fallback / Desktop Support**: On desktop browser / non-XR mode, the menu is accessible via a quiet floating trigger or keyboard shortcuts (`F` or `Q`), ensuring full testability across devices.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│               left-hand / left-controller               │
│         (Tracks position, rotation & palm normal)      │
└──────────────────────────┬─────────────────────────────┘
                           │ dot(handUp, cameraDir) > threshold
                           ▼
┌────────────────────────────────────────────────────────┐
│              wrist-flip-quick-menu                     │
│    (Spawns 4 radial 3D buttons: Brush, Converge,       │
│                Mic Breath, Stillness)                  │
└──────────────────────────┬─────────────────────────────┘
                           │ click / fingertip touch
                           ▼
┌────────────────────────────────────────────────────────┐
│       Event Dispatchers (tabsirah-*-toggle / haptic)    │
└────────────────────────────────────────────────────────┘
```

- **State Management**: Zero global dependencies; listens to xr orientation and dispatches standard Tabsirah events (`tabsirah-wonder-brush-toggle`, `tabsirah-convergence-toggle`, `tabsirah-mic-breath`, `tabsirah-stillness-toggle`).
- **Performance**: Zero-GC vector allocation at module scope, updating transform matrices at 60 FPS without memory pressure.
