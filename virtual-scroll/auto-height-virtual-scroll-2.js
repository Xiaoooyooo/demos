/**
 * @typedef {object} AutoHeightVirtualScrollOptions
 * @property {HTMLElement} container
 * @property {number} defaultItemHeight
 */

/**
 * @typedef {object} P
 * @property {number} P.height
 * @property {number} P.top
 */

class AutoHeightVirtualScroll_II {
  /**
   * @type {HTMLElement}
   * @description 容器元素
   */
  container = null;
  /**
   * @type {number}
   * @description 容器高度
   */
  containerHeight = 0;
  /**
   * @type {number}
   * @default 50
   * @description 默认节点高度
   */
  defaultItemHeight = 50;
  /**
   * @type {any[]}
   * @description 渲染节点数据
   */
  data = [];

  /**
   * @type {HTMLElement}
   * @description 显示渲染节点的元素
   */
  viewElement = null;
  /**
   * @type {number}
   * @description 滚动高度
   */
  scrollHeight = 0;
  /**
   * @type {number[]}
   * @description 上次渲染的节点范围
   */
  renderRange = [0, 0];
  /**
   * @type {Map<number, HTMLElement>}
   * @description 上次渲染节点集合
   */
  renderElements = new Map();
  /**
   * @type {P[]}
   */
  positions = [];
  /**
   * @param {AutoHeightVirtualScrollOptions} options
   */
  constructor(options) {
    const { container, defaultItemHeight = 50 } = options;
    this.container = container;
    this.defaultItemHeight = defaultItemHeight;
    this.containerHeight = container.clientHeight;

    this.initContainer();
    this.bindEvent();
  }

  initContainer() {
    this.container.style.overflow = "auto";
    this.container.style.position = "relative";

    this.viewElement = document.createElement("div");

    this.container.append(this.viewElement);
  }

  /**
   * @param {*[]} data
   */
  setData(data) {
    this.positions = Array(data.length).fill(null);
    for (let i = 0; i < data.length; i++) {
      this.positions[i] = {
        height: this.defaultItemHeight,
        top: i * this.defaultItemHeight,
      };
    }
    this.data = data;
    this.setScrollHeight({ height: data.length * this.defaultItemHeight });
    this.renderList(this.container.scrollTop);
  }

  /**
   * @param {object} param
   * @param {number} param.height
   * @param {number} param.change
   */
  setScrollHeight({ height, change }) {
    if (typeof height === "number") {
      this.scrollHeight = height;
    } else {
      this.scrollHeight += change;
    }
    this.viewElement.style.height = `${this.scrollHeight}px`;
  }

  /**
   * @param {number} index
   */
  createItem(index) {
    const item = document.createElement("div");
    item.style.padding = "0.5em 0";
    const a = document.createElement("p");
    a.innerText = index;
    const b = document.createElement("p");
    b.innerText = this.data[index];
    item.append(a, b);
    return item;
  }
  renderList(scrollTop) {
    let left = 0,
      right = this.data.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (this.positions[mid].top + this.positions[mid].height >= scrollTop) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    const startIndex = left;
    let endIndex = startIndex;
    while (this.positions[endIndex].top <= scrollTop + this.containerHeight) {
      if (endIndex + 1 < this.data.length) {
        endIndex++;
      } else {
        break;
      }
    }
    if (
      this.renderRange[0] === startIndex &&
      this.renderRange[1] === endIndex
    ) {
      return;
    }

    for (let i = this.renderRange[0]; i < startIndex; i++) {
      if (this.renderElements.has(i)) {
        this.renderElements.get(i).remove();
        this.renderElements.delete(i);
      }
    }
    for (let i = endIndex; i <= this.renderRange[1]; i++) {
      if (this.renderElements.has(i)) {
        this.renderElements.get(i).remove();
        this.renderElements.delete(i);
      }
    }
    this.renderRange = [startIndex, endIndex];

    const f = document.createDocumentFragment();
    let flag = 1;
    for (let i = startIndex; i <= endIndex; i++) {
      if (!this.renderElements.has(i)) {
        const item = this.createItem(i);
        item.style.position = "absolute";
        f.append(item);
        this.renderElements.set(i, item);
      } else if (flag === 1) {
        this.viewElement.prepend(f);
        flag = 0;
      }
    }
    this.viewElement.append(f);

    let offset = 0;
    for (let i = startIndex; i < this.data.length; i++) {
      this.positions[i].top += offset;
      const element = this.renderElements.get(i);
      if (element) {
        element.style.transform = `translate(0, ${this.positions[i].top}px)`;
        if (this.positions[i].height === this.defaultItemHeight) {
          this.positions[i].height = element.clientHeight;
          offset += this.positions[i].height - this.defaultItemHeight;
        }
      }
    }
    if (offset !== 0) {
      this.setScrollHeight({ change: offset });
    }
  }
  /**
   * @private
   */
  bindEvent() {
    const _this = this;
    this.container.addEventListener("scroll", function () {
      _this.renderList(this.scrollTop);
    });
  }
}
