/** @type {HTMLDivElement} */
const container = document.getElementById("container");

const instance = new AutoHeightVirtualScroll_I({
  container,
  defaultItemHeight: 45,
});

// const instance = new AutoHeightVirtualScroll_II({
//   container,
//   defaultItemHeight: 45,
// });

const items = Array(10000)
  .fill(0)
  // .map((el, index) => index);
  .map(() => getRandomText());
// .map(() => getRandomTextI());

instance.setData(items);
