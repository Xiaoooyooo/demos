/** @type {HTMLDivElement} */
const container = document.getElementById("container");

/**
 * @typedef {object} VirtualScrollOption
 * @property {HTMLElement} container
 * @property {number} itemHeight
 */

class VirtualScroll {
  /**
   * @type {HTMLElement}
   * @description 滚动容器元素
   * @private
   */
  container = null;

  /**
   * @type {number}
   * @description 容器高度
   * @private
   */
  containerHeight = 0;
  /**
   * @type {any[]}
   * @description 列表数据
   * @private
   */
  data = [];
  /**
   * @type {number}
   * @description 每项高度
   * @private
   */
  itemHeight = null;
  /**
   * @type {number}
   * @description 滚动区域总高度
   * @private
   */
  scrollHeight = 0;
  /**
   * @type {HTMLElement}
   * @description 撑开滚动高度的占位元素
   * @private
   */
  fakeListElement = null;
  /**
   * @type {HTMLElement}
   * @description 实际渲染元素
   * @private
   */
  viewElement = null;
  /**
   * @type {number}
   * @description 上一次的第一个可见项目索引
   * @private
   */
  prevStartIndex = 0;
  /**
   * @type {Map<number, HTMLElement>}
   * @description 渲染的可见项目元素
   * @private
   */
  renderElements = new Map();

  /**
   * @param {VirtualScrollOption} options
   */
  constructor(options) {
    const { container, itemHeight } = options;
    this.container = container;
    this.containerHeight = this.container.clientHeight;
    this.itemHeight = itemHeight;
    this.bindScrollEvent();
    this.initContainer();
    this.initViewElement();
  }

  /**
   * @description 为视图元素添加必要的样式
   * @private
   */
  initViewElement() {
    this.viewElement = document.createElement("div");
    this.viewElement.style.position = "absolute";
    this.viewElement.style.width = "100%";
    this.viewElement.style.top = 0;
    // 高亮可见区域
    this.viewElement.style.background = "hotpink";
    this.container.appendChild(this.viewElement);
  }

  /**
   * @description 为容器元素添加必要的样式
   * @private
   */
  initContainer() {
    this.container.style.position = "relative";
    this.container.style.overflow = "auto";
  }

  /**
   * @param {any[]} data
   * @description 更新数据
   */
  setData(data) {
    this.data = data;
    this.updateFakeListElement();
    this.renderList(this.container.scrollTop);
  }

  /**
   * @description 更新滚动区域高度
   * @private
   */
  updateFakeListElement() {
    if (!this.fakeListElement) {
      this.fakeListElement = document.createElement("div");
      this.container.appendChild(this.fakeListElement);
    }
    this.scrollHeight = this.data.length * this.itemHeight;
    this.fakeListElement.style.height = `${this.scrollHeight}px`;
  }

  /**
   * @param {number} scrollTop
   * @description 渲染可见项目
   * @private
   */
  // renderList(scrollTop) {
  //   // 定位视图元素到可见位置
  //   this.viewElement.style.transform = `translate(0, ${
  //     scrollTop - (scrollTop % this.itemHeight)
  //   }px)`;
  //   // 通过滚动距离计算第一个可见项目
  //   const start = Math.floor(scrollTop / this.itemHeight);
  //   // 根据可见区域高度计算最多能够观察到的项目数
  //   const count = Math.ceil(this.containerHeight / this.itemHeight);
  //   const f = document.createDocumentFragment();
  //   // 动态创建可见项目元素
  //   for (let i = start; i <= start + count && i < this.data.length; i++) {
  //     const item = document.createElement("div");
  //     item.style.height = `${this.itemHeight}px`;
  //     item.style.itemHeight = `${this.itemHeight}px`;
  //     item.innerText = JSON.stringify(this.data[i]);
  //     f.appendChild(item);
  //   }
  //   // 最后替换视图元素中的所有元素
  //   this.viewElement.replaceChildren(f);
  // }

  renderList(scrollTop) {
    // 定位视图元素到可见位置
    this.viewElement.style.transform = `translate(0, ${
      scrollTop - (scrollTop % this.itemHeight)
    }px)`;
    // 通过滚动距离计算第一个可见项目
    const start = Math.floor(scrollTop / this.itemHeight);
    // 根据可见区域高度计算最多能够观察到的项目数
    const count = Math.ceil(this.containerHeight / this.itemHeight);
    const prevStart = this.prevStartIndex;
    // prevStart 可能大于 start，也可能小于 start
    // 可以根据这种关系判断滚动方向
    // 当 prevStart 小于 start 时，说明顶部有元素离开
    for (let i = prevStart; i < start; i++) {
      if (this.renderElements.has(i)) {
        this.renderElements.get(i).remove();
        this.renderElements.delete(i);
      }
    }
    // 当 prevStart 大于 start 时，说明底部有元素离开
    for (let i = start + count; i <= prevStart + count; i++) {
      if (this.renderElements.has(i)) {
        this.renderElements.get(i).remove();
        this.renderElements.delete(i);
      }
    }
    // flag 为 1 时在顶部添加元素，为 0 时在底部添加元素
    let flag = 1;
    let f = document.createDocumentFragment();
    // 根据当前可视范围新增部分元素
    for (let i = start; i <= start + count && i < this.data.length; i++) {
      if (!this.renderElements.has(i)) {
        const item = this.createItem(i);
        this.renderElements.set(i, item);
        f.appendChild(item);
      } else if (flag === 1) {
        flag === 0;
        this.viewElement.prepend(f);
        f = document.createDocumentFragment();
      }
    }
    this.viewElement.append(f);
    // 记录本次开始渲染的项目索引
    this.prevStartIndex = start;
  }

  /**
   * @type {number}
   * @description 根据索引创建项目元素
   * @private
   */
  createItem(index) {
    const item = document.createElement("div");
    item.style.height = `${this.itemHeight}px`;
    item.innerText = JSON.stringify(this.data[index]);
    return item;
  }

  /**
   * @description 为容器元素绑定滚动事件
   * @private
   */
  bindScrollEvent() {
    const _this = this;
    this.container.addEventListener("scroll", function () {
      _this.renderList(this.scrollTop);
    });
  }
}

const instance = new VirtualScroll({ container, itemHeight: 45 });

const items = Array(100000)
  .fill(0)
  .map((el, index) => index);

instance.setData(items);
