// App.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import * as MathJS from "mathjs";
import * as ScreenOrientation from "expo-screen-orientation";
import CalculatorButton from "./CalculatorButton";
import SplashScreen from "./SplashScreen";

export default function App() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [isLandscape, setIsLandscape] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const { width, height } = useWindowDimensions();

  useEffect(() => {
    setIsLandscape(width > height);
  }, [width, height]);

  useEffect(() => {
    let subscription = null;
    const initOrientation = async () => {
      try { await ScreenOrientation.unlockAsync(); } catch {}
      try {
        const current = await ScreenOrientation.getOrientationAsync();
        setIsLandscape(
          current === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
          current === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
        );
      } catch {}
      try {
        subscription = ScreenOrientation.addOrientationChangeListener((evt) => {
          const o = evt.orientationInfo.orientation;
          setIsLandscape(
            o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
            o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
          );
        });
      } catch {}
    };
    initOrientation();
    return () => {
      try {
        if (subscription) ScreenOrientation.removeOrientationChangeListener(subscription);
      } catch {}
    };
  }, []);

  const isOperatorLabel = (val) => ["÷", "×", "−", "+", "="].includes(val);
  const operatorSymbols = ["/", "*", "-", "+", "^"];

  const buttonsPortrait = [
    ["AC", "+/−", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    [["0", 2], [",", 1], ["=", 1]],
  ];

  const buttonsLandscape = [
    ["(", ")", "mc", "m+", "m-", "mr", "AC", "+/−", "%", "÷"],
    ["2nd", "x²", "x³", "xʸ", "eˣ", "10ˣ", "7", "8", "9", "×"],
    ["x¹", "√x", "∛x", "ʸ√x", "ln", "log₁₀", "4", "5", "6", "−"],
    ["x!", "sin", "cos", "tan", "e", "EE", "1", "2", "3", "+"],
    ["Rad", "sinh", "cosh", "tanh", "π", "Rand", "0", ",", "=", null],
  ];

  const mapLabelToExpression = (label) => {
    const mappings = {
      "÷": "/", "×": "*", "−": "-", ",": ".", "π": "pi",
      "eˣ": "exp(", "x²": "^2", "x³": "^3", "xʸ": "^",
      "√x": "sqrt(", "∛x": "cbrt(", "ʸ√x": "nthRoot(",
      "ln": "log(", "log₁₀": "log10(", "sin": "sin(", "cos": "cos(", "tan": "tan(",
      "sinh": "sinh(", "cosh": "cosh(", "tanh": "tanh(", "x!": "factorial(",
      "+/−": "negate(", "%": "/100", "e": "e", "EE": "e", "Rand": "random()",
    };
    return mappings[label] !== undefined ? mappings[label] : label;
  };

  const handlePressMapped = (label) => {
    if (label === "AC") { setExpression(""); setResult("0"); return; }
    if (label === "=") {
      try {
        let expr = expression.replace(/÷/g, "/").replace(/×/g, "*").replace(/−/g, "-").replace(/,/g, ".");
        expr = expr.replace(/negate\(/g, "(-1)*(");
        const evaluated = MathJS.evaluate(expr);
        setResult(String(isFinite(evaluated) ? evaluated : "Error"));
      } catch { setResult("Error"); }
      return;
    }
    const mappedValue = mapLabelToExpression(label);
    const lastChar = expression.slice(-1);
    if (operatorSymbols.includes(mappedValue) && operatorSymbols.includes(lastChar)) {
      setExpression((prev) => prev.slice(0, -1) + mappedValue);
      return;
    }
    setExpression((prev) => prev + mappedValue);
  };

  const renderButtons = (buttons) =>
    buttons.map((row, i) => (
      <View key={i} style={styles.row}>
        {row.map((btn, j) => {
          if (btn === null || btn === undefined) return <View key={j} style={[styles.button, { opacity: 0 }]} />;
          let label, flex = 1;
          if (Array.isArray(btn)) [label, flex] = btn; else label = btn;

          let type = "default";
          if (isOperatorLabel(label)) type = "operator";
          else if (["AC", "+/−", "%"].includes(label)) type = "special";
          else if (isNaN(label) && !["AC", "+/−", "%", "(", ")", "Rand", "EE", ",", "="].includes(label)) type = "func";

          return <CalculatorButton key={j} label={label} flex={flex} type={type} onPress={handlePressMapped} />;
        })}
      </View>
    ));

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.displayContainer}>
        <ScrollView horizontal contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }} showsHorizontalScrollIndicator={false}>
          <Text style={styles.expressionText}>{expression}</Text>
        </ScrollView>
        <Text style={styles.resultText}>{result}</Text>
      </View>
      <View style={styles.buttonsContainer}>
        {isLandscape ? renderButtons(buttonsLandscape) : renderButtons(buttonsPortrait)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#3b3b3b", justifyContent: "flex-end" },
  displayContainer: { backgroundColor: "#4b4b4b", padding: 10, minHeight: 120, justifyContent: "center" },
  expressionText: { color: "#ccc", fontSize: 24, textAlign: "right" },
  resultText: { color: "white", fontSize: 40, textAlign: "right", fontWeight: "600" },
  buttonsContainer: { padding: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  button: { flex: 1, margin: 2, borderRadius: 6, justifyContent: "center", alignItems: "center", height: 60 },
});
