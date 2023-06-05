import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
type TransitionProps = {
  visible: boolean;
  children: JSX.Element;
  beforeEnterClass: string;
  enterActiveClass: string;
  enterDoneClass: string;
  beforeLeaveClass: string;
  leaveActiveClass: string;
  leaveDoneClass: string;
};

type TransitionStage =
  | "before-enter"
  | "enter-active"
  | "enter-done"
  | "before-leave"
  | "leave-active"
  | "leave-done";

export default function Transition(props: TransitionProps) {
  const {
    visible,
    children,
    beforeEnterClass,
    enterActiveClass,
    enterDoneClass,
    beforeLeaveClass,
    leaveActiveClass,
    leaveDoneClass,
  } = props;
  const [stage, changeStage] = useState<TransitionStage>(
    visible ? "enter-done" : "leave-done"
  );
  const ref = useRef<HTMLDivElement>(null);
  const onEnterTransitionendCallback = useCallback(() => {
    changeStage("enter-done");
  }, []);
  const onLeaveTransitionendCallback = useCallback(() => {
    changeStage("leave-done");
  }, []);
  useEffect(() => {
    if (visible) {
      if (stage === "leave-done") {
        changeStage("before-enter");
      } else if (stage === "leave-active") {
        ref.current!.removeEventListener(
          "transitionend",
          onLeaveTransitionendCallback
        );
        changeStage("enter-active");
      }
    } else {
      if (stage === "enter-done") {
        changeStage("before-leave");
      } else if (stage === "enter-active") {
        ref.current!.removeEventListener(
          "transitionend",
          onEnterTransitionendCallback
        );
        changeStage("leave-active");
      }
    }
  }, [visible]);
  useEffect(() => {
    if (stage === "before-enter") {
      requestAnimationFrame(() => {
        changeStage("enter-active");
      });
    } else if (stage === "enter-active") {
      ref.current!.addEventListener(
        "transitionend",
        onEnterTransitionendCallback,
        { once: true }
      );
    } else if (stage === "before-leave") {
      requestAnimationFrame(() => {
        changeStage("leave-active");
      });
    } else if (stage === "leave-active") {
      ref.current!.addEventListener(
        "transitionend",
        onLeaveTransitionendCallback,
        { once: true }
      );
    }
  }, [stage]);
  let content: JSX.Element | null;
  switch (stage) {
    case "before-enter": {
      content = (
        <div ref={ref} className={beforeEnterClass}>
          {children}
        </div>
      );
      break;
    }
    case "enter-active": {
      content = (
        <div ref={ref} className={`${enterActiveClass} ${enterDoneClass}`}>
          {children}
        </div>
      );
      break;
    }
    case "enter-done": {
      content = children;
      break;
    }
    case "before-leave": {
      content = (
        <div ref={ref} className={beforeLeaveClass}>
          {children}
        </div>
      );
      break;
    }
    case "leave-active": {
      content = (
        <div ref={ref} className={`${leaveActiveClass} ${leaveDoneClass}`}>
          {children}
        </div>
      );
      break;
    }
    case "leave-done": {
      content = null;
    }
  }
  return createPortal(content, document.body);
}
