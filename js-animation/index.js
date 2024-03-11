const targetElement = document.querySelector(".target");

const animation = new AnimationControl({
  duration: 2000,
  // repeat: 3,
  repeat: "infinite",
  // direction: -1,
  alternate: true,
  // onUpdate(state) {
  //   // console.log(state);
  //   targetElement.style.transform = `translateX(${200 * state}px)`;
  // },
});

animation
  .addStage({
    start: 0,
    end: 1000,
    onUpdate(state) {
      targetElement.style.transform = `translateX(${200 * state}px)`;
    },
  })
  .addStage({
    start: 1000,
    end: 2000,
    onUpdate(state) {
      targetElement.style.opacity = 1 - state;
    },
  });

animation.start();

const btns = document.querySelectorAll("[data-btn='action']");

btns.forEach((btn) => {
  btn.addEventListener("click", function () {
    animation[this.dataset.actionType]?.();
  });
});
