import { useState } from "react";
import Transition from "./Transition";

export default function App() {
  const [visible, changeVisible] = useState(false);
  return (
    <div>
      <button onClick={() => changeVisible((v) => !v)}>toggle</button>
      <Transition
        visible={visible}
        beforeEnterClass="opacity-0"
        enterActiveClass="opacity-100 transition-opacity duration-1000"
        beforeLeaveClass="opacity-100"
        leaveActiveClass="opacity-0 transition-opacity duration-1000"
      >
        <div>This is a test.</div>
      </Transition>
    </div>
  );
}
