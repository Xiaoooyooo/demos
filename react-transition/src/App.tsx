import { useState } from "react";
import Transition from "./Transition";
import Transition1 from "./Transition1";

export default function App() {
  const [visible, changeVisible] = useState(false);
  return (
    <div className="mt-80 text-center">
      <button onClick={() => changeVisible((v) => !v)}>toggle</button>
      <Transition
        visible={visible}
        beforeEnterClass="opacity-0"
        enterActiveClass="transition-opacity duration-1000"
        enterDoneClass="opacity-100"
        beforeLeaveClass="opacity-100"
        leaveActiveClass="transition-opacity duration-1000"
        leaveDoneClass="opacity-0"
      >
        <div className="text-center">This is a test.</div>
      </Transition>
      <Transition1
        visible={visible}
        beforeEnterClass="opacity-0"
        enterActiveClass="transition-opacity duration-1000"
        enterDoneClass="opacity-100"
        beforeLeaveClass="opacity-100"
        leaveActiveClass="transition-opacity duration-1000"
        leaveDoneClass="opacity-0"
      >
        <div className="text-center">This is a test.</div>
      </Transition1>
      <Transition1 visible={visible} duration={1000}>
        {(stage) => (
          <div
            className={`text-center${
              stage === "before-enter" ? " opacity-0" : ""
            }${
              stage === "enter-active"
                ? " transition-opacity duration-1000 opacity-100"
                : ""
            }${stage === "enter-done" ? " opacity-100" : ""}${
              stage === "before-leave" ? " opacity-100" : ""
            }${
              stage === "leave-active"
                ? " transition-opacity duration-1000 opacity-0"
                : ""
            }${stage === "leave-done" ? " opacity-0" : ""}`}
          >
            This is a test.
          </div>
        )}
      </Transition1>
    </div>
  );
}
