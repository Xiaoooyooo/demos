import { render } from "react-dom";

import "./svgs/anchorage_single.svg";

function SvgIcon(props) {
  const { icon } = props;
  const iconName = `#${icon}`;
  return (
    <svg>
      <use href={iconName} />
    </svg>
  );
}

function App() {
  return (
    <div>
      <SvgIcon icon="anchorage_single" />
    </div>
  );
}

render(<App />, document.getElementById("root"));
