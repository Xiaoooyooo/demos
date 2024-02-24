function getRandomText() {
  const len = Math.round(Math.random() * 100) + 50;
  // const len = Math.round(Math.random() * 20) + 20;
  let text = "";
  for (let i = 0; i < len; i++) {
    const char = 20320 + Math.round(Math.random() * (38745 - 20320));
    text += String.fromCharCode(char);
  }
  text += "。";
  return text;
}

function getRandomTextI() {
  const len = Math.round(Math.random() * 100) + 50;
  let text = "";
  for (let i = 0; i < len; i++) {
    if (Math.random() < 0.1) {
      text += " ";
    } else {
      const char = 97 + Math.round(Math.random() * (122 - 97)); // 生成小写英文随机字符
      text += String.fromCharCode(char);
    }
  }
  text += ".";
  return text;
}
