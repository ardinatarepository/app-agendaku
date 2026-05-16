// tabBarControl.js
// Utility jembatan untuk mengontrol animasi Tab Bar dari layar mana pun

let _animateTabBar = null;
let _resetTabBar = null;

export const registerTabBarAnimator = (animateFn, resetFn) => {
  _animateTabBar = animateFn;
  _resetTabBar = resetFn;
};

// Untuk scroll: animasi smooth hide/show
export const setTabBarVisible = (visible) => {
  _animateTabBar?.(visible);
};

// Untuk pindah tab: muncul INSTAN tanpa animasi
export const resetTabBarVisible = () => {
  _resetTabBar?.();
};
