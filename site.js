const display = document.getElementById("display");
const buttons = document.querySelectorAll(".buttons button");

let expression = "";
let displayExpr = "";
let ans = 0;
let error = false;

// ROOT MODE
let rootMode = false;
let rootLeft = "";
let rootRight = "";
let fillingLeft = true;

// fraction mode
let showFraction = true;
let lastResult = null;

// FRAC toggle
const fracBtn = document.getElementById("frac-btn");
fracBtn.addEventListener("click", () => {
    showFraction = !showFraction;
    fracBtn.textContent = showFraction ? "FRAC" : "DEC";

    if (lastResult !== null) {
        updateResultDisplay(lastResult);
    }
});

// ---------- SAFE EVAL ----------
function safeEval(expr) {
  return Function('"use strict"; return (' + expr + ')')();
}

// ---------- DISPLAY ----------
function updateDisplay() {
  display.innerHTML = displayExpr || "0";
}

// ---------- RESULT DISPLAY ----------
function updateResultDisplay(result) {
  const frac = decimalToFraction(result);

  displayExpr = (showFraction && frac)
    ? formatFractionHTML(frac)
    : result.toString();

  updateDisplay();
}

// ---------- NORMALIZE ----------
function normalize(expr) {
  return expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/ANS/g, ans);
}

// ---------- FRACTION ----------
function decimalToFraction(x, tolerance = 1e-10) {
  if (Number.isInteger(x)) return null;

  let sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  let h1 = 1, h2 = 0;
  let k1 = 0, k2 = 1;
  let b = x;

  do {
    let a = Math.floor(b);
    let h = a*h1 + h2;
    let k = a*k1 + k2;

    if (Math.abs(x - h/k) < tolerance) {
      return `${sign * h}/${k}`;
    }

    h2 = h1; h1 = h;
    k2 = k1; k1 = k;
    b = 1/(b-a);
  } while(true);
}

function formatFractionHTML(frac) {
  const [top, bottom] = frac.split("/");
  return `
    <span class="fraction">
      <span class="top">${top}</span>
      <span class="bar"></span>
      <span class="bottom">${bottom}</span>
    </span>
  `;
}

// ---------- ROOT DISPLAY ----------
function renderRoot() {
  const left = rootLeft || "□";
  const right = rootRight || "□";
  displayExpr = `${left}√${right}`;
  updateDisplay();
}

// ---------- BUTTON HANDLER ----------
buttons.forEach(button => {
  button.addEventListener("click", () => {
    const value = button.textContent;

    if (error && value !== "AC") return;

    // AC
    if (value === "AC") {
      expression = "";
      displayExpr = "";
      rootMode = false;
      rootLeft = "";
      rootRight = "";
      fillingLeft = true;
      lastResult = null;
      error = false;
      updateDisplay();
      return;
    }

    // BACKSPACE
    if (value === "⌫") {
      if (rootMode) {
        if (!fillingLeft && rootRight.length > 0) {
          rootRight = rootRight.slice(0, -1);
        } else {
          rootLeft = rootLeft.slice(0, -1);
        }
        renderRoot();
      } else {
        expression = expression.slice(0, -1);
        displayExpr = expression;
        updateDisplay();
      }
      return;
    }

    // EQUALS
    if (value === "=") {
      try {
        let result;

        if (rootMode) {
          if (!rootLeft || !rootRight) throw "Math ERROR";
          result = safeEval(`${rootRight}**(1/${rootLeft})`);
          rootMode = false;
        } else {
          result = safeEval(normalize(expression));
        }

        if (!isFinite(result)) throw "Math ERROR";

        ans = result;
        expression = result.toString();
        lastResult = result;

        updateResultDisplay(result);

      } catch {
        displayExpr = "Math ERROR";
        expression = "";
        lastResult = null;
        error = true;
        updateDisplay();
      }
      return;
    }

    // y√x
    if (value === "y√x") {
      rootMode = true;
      rootLeft = "";
      rootRight = "";
      fillingLeft = true;
      renderRoot();
      return;
    }

    // NUMBERS
    if (/^[0-9.]$/.test(value)) {
      if (rootMode) {
        if (fillingLeft) {
          rootLeft += value;
          if (rootLeft.length > 0) fillingLeft = false;
        } else {
          rootRight += value;
        }
        renderRoot();
      } else {
        expression += value;
        displayExpr += value;
        updateDisplay();
      }
      return;
    }

    // OPERATORS
    if (["+","−","×","÷","(",")"].includes(value)) {
      if (!rootMode) {
        expression += value;
        displayExpr += value;
        updateDisplay();
      }
      return;
    }

    // π
    if (value === "π") {
      if (!rootMode) {
        expression += "Math.PI";
        displayExpr += "π";
        updateDisplay();
      }
      return;
    }

    // x²
    if (value === "x²") {
      if (!rootMode) {
        expression += "**2";
        displayExpr += "<sup>2</sup>";
        updateDisplay();
      }
      return;
    }

    // xʸ
    if (value === "xʸ") {
      if (!rootMode) {
        expression += "**";
        displayExpr += "^";
        updateDisplay();
      }
      return;
    }

    // %
    if (value === "%") {
      if (!rootMode) {
        expression += "/100";
        displayExpr += "%";
        updateDisplay();
      }
      return;
    }
  });
});