import {
  useEffect,
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";

type TransitionStage =
  | "before-enter"
  | "enter-active"
  | "enter-done"
  | "before-leave"
  | "leave-active"
  | "leave-done";

type JSXTransitionProps = {
  visible: boolean;
  children: JSX.Element;
  beforeEnterClass: string;
  enterActiveClass: string;
  enterDoneClass: string;
  beforeLeaveClass: string;
  leaveActiveClass: string;
  leaveDoneClass: string;
};

type FunctionTransitionProps = {
  visible: boolean;
  children: (stage: TransitionStage) => JSX.Element;
  duration: number;
};
type TransitionProps = JSXTransitionProps | FunctionTransitionProps;
type InternalTransitionProps = {
  stage: TransitionStage;
  onEnterTransitionEnd: () => void;
  onLeaveTransitionEnd: () => void;
};
type CallbackFns = {
  bindEnterDoneCallback: () => void;
  unbindEnterDoneCallback: () => void;
  bindleaveDoneCallback: () => void;
  unbindleaveDoneCallback: () => void;
};

function Transition(props: TransitionProps) {
  const { visible, children } = props;
  const ref = useRef<CallbackFns>(null);
  const [stage, changeStage] = useState<TransitionStage>(
    visible ? "enter-done" : "leave-done"
  );
  const onEnterTransitionEnd = useCallback(() => {
    changeStage("enter-done");
  }, []);
  const onLeaveTransitionEnd = useCallback(() => {
    changeStage("leave-done");
  }, []);
  useEffect(() => {
    if (visible) {
      if (stage === "leave-active") {
        changeStage("enter-active");
        ref.current!.unbindleaveDoneCallback();
      } else if (stage === "leave-done") {
        changeStage("before-enter");
      }
    } else {
      if (stage === "enter-active") {
        changeStage("leave-active");
        ref.current!.unbindEnterDoneCallback();
      } else if (stage == "enter-done") {
        changeStage("before-leave");
      }
    }
  }, [visible]);
  useEffect(() => {
    if (stage === "before-enter") {
      requestAnimationFrame(() => {
        changeStage("enter-active");
      });
    } else if (stage === "enter-active") {
      ref.current!.bindEnterDoneCallback();
    } else if (stage === "before-leave") {
      requestAnimationFrame(() => {
        changeStage("leave-active");
      });
    } else if (stage === "leave-active") {
      ref.current!.bindleaveDoneCallback();
    }
  }, [stage]);

  if (typeof children === "function") {
    const { children, duration } = props as FunctionTransitionProps;
    return (
      <TransitionWithFunction
        stage={stage}
        onEnterTransitionEnd={onEnterTransitionEnd}
        onLeaveTransitionEnd={onLeaveTransitionEnd}
        duration={duration}
        ref={ref}
      >
        {children}
      </TransitionWithFunction>
    );
  } else {
    const { visible, children, ...rest } = props as JSXTransitionProps;
    return (
      <TransitionWithJSX
        stage={stage}
        onEnterTransitionEnd={onEnterTransitionEnd}
        onLeaveTransitionEnd={onLeaveTransitionEnd}
        ref={ref}
        {...rest}
      >
        {children}
      </TransitionWithJSX>
    );
  }
}

const TransitionWithJSX = forwardRef<
  CallbackFns,
  Omit<JSXTransitionProps, "visible"> & InternalTransitionProps
>(function (props, pref) {
  const {
    stage,
    children,
    beforeEnterClass,
    enterActiveClass,
    enterDoneClass,
    beforeLeaveClass,
    leaveActiveClass,
    leaveDoneClass,
    onEnterTransitionEnd,
    onLeaveTransitionEnd,
  } = props;
  const ref = useRef<HTMLDivElement>(null);
  useImperativeHandle(
    pref,
    () => {
      return {
        bindEnterDoneCallback: function () {
          (ref.current as HTMLDivElement).addEventListener(
            "transitionend",
            onEnterTransitionEnd,
            { once: true }
          );
        },
        unbindEnterDoneCallback: function () {
          (ref.current as HTMLDivElement).removeEventListener(
            "transitionend",
            onEnterTransitionEnd
          );
        },
        bindleaveDoneCallback: function () {
          (ref.current as HTMLElement).addEventListener(
            "transitionend",
            onLeaveTransitionEnd,
            { once: true }
          );
        },
        unbindleaveDoneCallback: function () {
          (ref.current as HTMLElement).removeEventListener(
            "transitionend",
            onLeaveTransitionEnd
          );
        },
      };
    },
    []
  );
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
});

const TransitionWithFunction = forwardRef<
  CallbackFns,
  Omit<FunctionTransitionProps, "visible"> & InternalTransitionProps
>((props, pref) => {
  const {
    children,
    stage,
    duration,
    onEnterTransitionEnd,
    onLeaveTransitionEnd,
  } = props;
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useImperativeHandle(
    pref,
    () => {
      return {
        bindEnterDoneCallback: function () {
          timer.current = setTimeout(onEnterTransitionEnd, duration);
        },
        unbindEnterDoneCallback: function () {
          clearTimeout(timer.current);
          timer.current = undefined;
        },
        bindleaveDoneCallback: function () {
          timer.current = setTimeout(onLeaveTransitionEnd, duration);
        },
        unbindleaveDoneCallback: function () {
          clearTimeout(timer.current);
          timer.current = undefined;
        },
      };
    },
    []
  );
  return createPortal(
    stage === "leave-done" ? null : children(stage),
    document.body
  );
});

export default Transition;
