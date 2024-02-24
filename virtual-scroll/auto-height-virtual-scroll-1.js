/**
 * @typedef {object} AutoHeightVirtualScrollOptions
 * @property {HTMLElement} container
 * @property {number} defaultItemHeight
 */

class AutoHeightVirtualScroll_I {
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
  renderRange = [-1, -1];
  /**
   * @type {Map<number, HTMLElement>}
   * @description 上次渲染节点集合
   */
  renderElements = new Map();
  /**
   * @type {number[]}
   * @description 存储渲染节点的高度
   */
  itemHeights = [];
  /**
   * @type {HTMLElement}
   * @description 撑开容器滚动高度的空元素
   */
  fakeListElement = null;
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

  /**
   * @description 初始化一些元素及其样式
   */
  initContainer() {
    this.container.style.overflow = "auto";
    this.container.style.position = "relative";

    this.fakeListElement = document.createElement("div");
    this.container.append(this.fakeListElement);

    this.viewElement = document.createElement("div");
    this.viewElement.style.position = "absolute";
    this.viewElement.style.top = 0;
    this.viewElement.style.width = "100%";
    this.container.append(this.viewElement);
  }

  /**
   * @param {object} param
   * @param {number} param.height 如果传递该值，更新容器高度为指定值
   * @param {number} param.change 如果没有传递 height，那么在原来容器高度值的基础上加上该值
   * @description 更新容器高度
   */
  setScrollHeight({ height, change }) {
    if (typeof height === "number") {
      this.scrollHeight = height;
    } else {
      this.scrollHeight += change;
    }
    this.fakeListElement.style.height = `${this.scrollHeight}px`;
  }

  /**
   * @param {*[]} data
   * @description 添加或更新数据
   */
  setData(data) {
    this.data = data;
    this.setScrollHeight({ height: data.length * this.defaultItemHeight });
    this.itemHeights = Array(data.length).fill(this.defaultItemHeight);
    this.renderList(this.container.scrollTop);
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

  /**
   * @param {number} scrollTop
   */
  renderList(scrollTop) {
    // 从第一个项目开始遍历，直到累计高度达到当前滚动位置
    let top = 0; // 累计高度
    let index = 0; // 当前遍历到的项目
    while (index < this.data.length) {
      if (top + this.itemHeights[index] >= scrollTop) {
        break;
      }
      top += this.itemHeights[index++];
    }
    // 记录第一个需要渲染的项目的位置
    const offset = top;
    // 记录第一个需要渲染的项目索引
    const startIndex = index;
    // 当前视图内可见的最底部的位置
    const bottom = scrollTop + this.containerHeight;
    while (top < bottom) {
      top += this.itemHeights[index];
      if (index + 1 < this.data.length) {
        index++;
      } else {
        break;
      }
    }
    // 记录最后一个需要渲染的项目索引
    const endIndex = index;

    // 如果渲染范围没有发生变化，那么什么都不做
    if (
      this.renderRange[0] === startIndex &&
      this.renderRange[1] === endIndex
    ) {
      return;
    }

    // 移除顶部离开的元素
    for (let i = this.renderRange[0]; i < startIndex; i++) {
      if (this.renderElements.has(i)) {
        this.renderElements.get(i).remove();
        this.renderElements.delete(i);
      }
    }

    // 移除底部离开的元素
    for (let i = endIndex; i <= this.renderRange[1]; i++) {
      if (this.renderElements.has(i)) {
        this.renderElements.get(i).remove();
        this.renderElements.delete(i);
      }
    }

    this.renderRange = [startIndex, endIndex];

    // flag 为 1 时在顶部添加元素，为 0 时在底部添加元素
    let flag = 1;
    const enteredElements = new Map();
    const f = document.createDocumentFragment();
    for (let i = startIndex; i <= endIndex; i++) {
      if (!this.renderElements.has(i)) {
        const item = this.createItem(i);
        f.append(item);
        enteredElements.set(i, item);
        this.renderElements.set(i, item);
      } else if (flag === 1) {
        this.viewElement.prepend(f);
        flag = 0;
      }
    }
    this.viewElement.append(f);

    // 记录当前渲染的元素的实际高度与预估高度之差
    let change = 0;
    for (const [index, element] of enteredElements.entries()) {
      if (this.itemHeights[index] === this.defaultItemHeight) {
        change += element.clientHeight - this.itemHeights[index];
        this.itemHeights[index] = element.clientHeight;
      }
    }

    // 更新视图元素的位置
    this.viewElement.style.transform = `translate(0, ${offset}px)`;

    // 如果当前渲染的所有元素高度之和与其预估高度之和不同，更新整个列表的高度
    if (change !== 0) {
      this.setScrollHeight({ change });
    }
  }

  /**
   * @description 绑定滚动事件
   */
  bindEvent() {
    const _this = this;
    this.container.addEventListener("scroll", function () {
      _this.renderList(this.scrollTop);
    });
  }
}
