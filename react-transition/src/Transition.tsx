import { useState, useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
type TransitionProps = {
  visible: boolean;
  children: JSX.Element;
  beforeEnterClass?: string;
  enterActiveClass?: string;
  enterDoneClass?: string;
  beforeLeaveClass?: string;
  leaveActiveClass?: string;
  leaveDoneClass?: string;
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
  const key = useId();
  const [stage, changeStage] = useState<TransitionStage>(
    visible ? "enter-done" : "leave-done"
  );
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (visible) {
      if (stage === "leave-done") {
        changeStage("before-enter");
      } else if (stage === "leave-active") {
        changeStage("enter-active");
      }
    } else {
      if (stage === "enter-done") {
        changeStage("before-leave");
      } else if (stage === "enter-active") {
        changeStage("leave-active");
      }
    }
  }, [visible]);
  useEffect(() => {
    console.log(stage)
    if (stage === "before-enter") {
      requestAnimationFrame(() => {
        changeStage("enter-active");
      });
    } else if (stage === "enter-active") {
      ref.current.addEventListener("transitionend", function () {
        console.log(111)
        changeStage("enter-done");
      });
    } else if (stage === "before-leave") {
      requestAnimationFrame(() => {
        changeStage("leave-active");
      });
    } else if (stage === "leave-active") {
      ref.current.addEventListener("transitionend", function () {
        console.log(222)
        changeStage("leave-done");
      });
    }
  }, [stage]);
  let content: JSX.Element | null;
  switch (stage) {
    case "before-enter": {
      content = (
        <div key={key} ref={ref} className={beforeEnterClass}>
          {children}
        </div>
      );
      break;
    }
    case "enter-active": {
      content = (
        <div key={key} ref={ref} className={enterActiveClass}>
          {children}
        </div>
      );
      break;
    }
    case "enter-done": {
      content = (
        <div key={key} ref={ref} className={enterDoneClass}>
          {children}
        </div>
      );
      break;
    }
    case "before-leave": {
      content = (
        <div key={key} ref={ref} className={beforeLeaveClass}>
          {children}
        </div>
      );
      break;
    }
    case "leave-active": {
      content = (
        <div key={key} ref={ref} className={leaveActiveClass}>
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
