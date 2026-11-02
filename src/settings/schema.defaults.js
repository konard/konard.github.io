// The default look of the site (issue #45: "That is defaults."). The issue
// gave the settings below, exactly as the "Your changes" box of the settings
// page shows them; they are put over the defaults of the fields, which stay the
// look of issue #39 (the glass universe) and return with the "Glass universe"
// preset (./presets.js). Settings added by issue #45 for the frames have
// defaults that keep the old looks unchanged; the values chosen for the new
// default look are at the end.
export const LOOK_45 = {
  // The settings of the issue, in its order.
  'nebula.gas': 0.5,
  'nebula.hue': -100,
  'nebula.stars': 3.2,
  'nebula.starBrightness': 1.15,
  'nebula.twinkle': 1.7,
  'nebula.vignette': 0.25,
  'nebula.zoom': 0.5,
  'nebula.starColor': '#17de1d',
  'nebula.resolution': 1,
  'grid.level': 1.3,
  'grid.style': 'dashed',
  'grid.tint': 'accent',
  'rain.level': 1.3,
  'rain.density': 0.8,
  'rain.glow': 10,
  'rain.glowColor': '#00ff66',
  'sound.hover1': 'byte',
  'sound.activate1': 'mica',
  'sound.activate2': 'none',
  'sound.notify1': 'cinder',
  'skin.name': 'futuristic',
  'future.palette': 'matrix',
  'future.frame': 'custom',
  'future.cut': 0,
  'future.border': 0.5,
  'future.accentBar': false,
  'future.surface': 'glass',
  'future.opacity': 0.5,
  'future.frameOpacity': 0.85,
  'future.accentLength': 428,
  'future.title': 'slash',
  'future.scanlines': 0.06,
  'corner.tlSize': 24,
  'corner.trLine': 'accent',
  'corner.trSize': 40,
  'corner.blLine': 'bracket',
  'ui.controlPadding': 6,
  'ui.sliderSize': 12,
  'ui.sliderTrack': 12,
  'ui.borderStyle': 'dashed',
};

/**
 * Issue #49 ("Make these defaults"): no motion and no sound until a visitor
 * switches them on. They are comfort settings that presets never change.
 */
export const COMFORT_49 = {
  'motion.mode': 'off',
  'sound.on': false,
};

/**
 * Issue #49: own small corners for the buttons and for the drop-down lists
 * (the frame level that was called "Menus"), in the order of the issue. The
 * "Glass universe" preset returns them to what they were, like the look of
 * issue #45.
 */
export const LOOK_49 = {
  'corner.buttonCorners': 'own',
  'corner.menuCorners': 'own',
  'corner.buttonEdgeStyle': 'dotted',
  'corner.buttonTlLine': 'accent',
  'corner.buttonTlSize': 6,
  'corner.buttonTrSize': 6,
  'corner.buttonBrShape': 'square',
  'corner.buttonBrSize': 6,
  'corner.buttonBlLine': 'accent',
  'corner.buttonBlSize': 6,
  'corner.menuEdges': 'none',
  'corner.menuEdgeStyle': 'solid',
  'corner.menuTlShape': 'square',
  'corner.menuTlSize': 6,
  'corner.menuTrSize': 6,
  'corner.menuBrShape': 'square',
  'corner.menuBrSize': 6,
  'corner.menuBlSize': 6,
};

/** The default look: the look of issue #45, the corners of issue #49 and its comfort settings. */
export const DEFAULT_LOOK = { ...LOOK_45, ...LOOK_49, ...COMFORT_49 };
