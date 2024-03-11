/**
 * @typedef {object} AnimationOptions
 * @property {number} duration
 * @property {number | "infinite"} repeat
 * @property {boolean} alternate
 * @property {Function} onUpdate
 * @property {Function} onStart
 * @property {Function} onEnd
 */

/**
 * @typedef {object} Stage
 * @property {number} start
 * @property {number} end
 * @property {Function} timingFn
 * @property {Function} onUpdate
 * @property {Function} onStart
 * @property {Function} onEnd
 */

/**
 * @param {number} time 一个 0 到 1 之间的值，代表当前时间在整个时间轴中的位置
 * @returns {number} 一个 0 到 1 之间的值，代表动画当前状态值
 */
function defaultTimingFunction(time) {
  return -Math.cos(time * Math.PI) / 2 + 0.5;
}

class AnimationControl {
  /**
   * @type {boolean}
   * @description 是否暂停
   */
  paused = true;
  /**
   * @type {number}
   * @description 上一帧时间
   */
  prevFrameTime = 0;
  /**
   * @type {number}
   * @description 当前动画状态时间戳
   */
  currentTime = 0;
  /**
   * @type {number}
   * @description 记录动画运行的次数
   */
  repeat = 0;
  /**
   * @type {1 | -1}
   * @default 1
   * @description 动画当前运行方向，1 表示正向，-1 表示反向
   */
  direction = 1;
  /**
   * @type {{ start: number, end: number, onUpdate: (state: number) => void }[]}
   * @description 动画阶段起始时间
   */
  stages = [];
  /**
   * @param {object} options
   * @param {number} options.duration 动画总的运行时间
   * @param {Function} options.onUpdate 用于更新每一帧动画元素状态
   * @param {number | "infinite"} options.repeat 动画最大运行次数
   * @param {1 | -1} options.direction 动画运行方向，1 表示正向，-1 表示反向
   * @param {boolean} options.alternate 动画到达结束状态时是否通过动画返回而不是瞬间返回
   */
  constructor(options) {
    this.options = Object.assign({ direction: 1, alternate: false }, options);
    // 动画初始运行方向以传入配置为准
    this.direction = this.options.direction;
  }

  /**
   * @description 重置控制器状态
   */
  resetState() {
    const { direction, duration } = this.options;
    // 如果动画是反方向的，那么将初始时间置为动画总时长
    this.currentTime = direction === 1 ? 0 : duration;
    this.prevFrameTime = undefined;
    this.repeat = 0;
  }

  /**
   * @param {number} timestamp requestAnimationFrame 时间戳
   * @private
   */
  draw(timestamp) {
    if (timestamp === undefined) {
      // timestamp 为 undefined 说明 draw 函数不是通过 requestAnimationFrame 调用的
      requestAnimationFrame(this.draw.bind(this));
      return;
    }

    const { duration, onUpdate, repeat, alternate } = this.options;

    if (repeat !== "infinite" && this.repeat === repeat) {
      this.paused = true;
    }

    if (this.paused) {
      // 暂停时清除上一帧时间，避免恢复时帧与帧之间时间间隔计算错误
      this.prevFrameTime = undefined;
      return;
    }

    if (alternate && this.currentTime === duration && this.direction === 1) {
      // 如果允许交替运行，且当前时间等于动画总时长，并且动画方向为正向，那么将动画方向重置为反向
      this.direction = -1;
    } else if (alternate && this.currentTime === 0 && this.direction === -1) {
      // 如果允许交替运行，且当前时间等于 0，并且动画方向为反向，那么将动画方向重置为正向
      this.direction = 1;
    }

    // 这里没有用 else if 接上的原因是：在此处读取到的 currentTime 实际上是上一帧的时间
    // 如果上一帧的时间正好等于动画时长，并且动画允许交替运行，那么直接将上一帧作为返回动画的第一帧
    // 否则，动画从时间 0 重新开始。反之亦然。
    if (!alternate && this.currentTime === duration && this.direction === 1) {
      // 如果不允许交替运行，并且当前时间等于动画总时长，并且动画方向为正向，那么将时间重置为 0
      this.currentTime = 0;
    } else if (!alternate && this.currentTime === 0 && this.direction === -1) {
      // 如果不允许交替运行，并且当前时间等于 0，并且动画方向为反向，那么将时间重置为最大动画时长
      this.currentTime = duration;
    } else if (this.prevFrameTime) {
      // 当前帧和上一帧相隔的时间
      const frameTime = timestamp - this.prevFrameTime;
      const currentTime = this.currentTime + this.direction * frameTime;

      if (currentTime >= duration || currentTime <= 0) {
        // 如果当前时间已经超过了动画总时长，或者小于 0，那么将重复次数加 1
        this.repeat++;
        if (currentTime >= duration) {
          this.currentTime = duration;
        } else if (currentTime <= 0) {
          this.currentTime = 0;
        }
      } else {
        this.currentTime = currentTime;
      }
    }
    this.prevFrameTime = timestamp;

    // // 当前时间点的状态
    // const state = defaultTimingFunction(this.currentTime / duration);
    // onUpdate(state);
    this.runStages(this.currentTime);

    requestAnimationFrame(this.draw.bind(this));
  }

  /**
   * @type {number}
   * @description 根据传入时间阶段的动画
   */
  runStages(time) {
    for (const { start, end, onUpdate } of this.stages) {
      if (time >= start && time <= end) {
        const duration = end - start;
        const state = defaultTimingFunction((time - start) / duration);
        onUpdate(state);
      }
    }
  }

  /**
   * @param {object} stage
   * @param {number} stage.start
   * @param {number} stage.end
   * @param {(state: number) => void} stage.onUpdate
   * @description 向整个动画中添加运行阶段
   */
  addStage(stage) {
    this.stages.push(stage);
    return this;
  }

  /**
   * @description 开始或重新开始动画
   */
  start() {
    this.resetState();
    if (this.paused) {
      this.paused = false;
      this.draw();
    }
  }

  /**
   * @description 暂停动画
   */
  pause() {
    this.paused = true;
  }

  /**
   * @description 恢复动画
   */
  resume() {
    this.paused = false;
    this.draw();
  }

  /**
   * @description 动画是否处于暂停状态
   */
  isPaused() {
    return this.paused;
  }
}
