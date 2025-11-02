import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import * as MathJS from "mathjs";
import * as ScreenOrientation from "expo-screen-orientation";

export default function App() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [isLandscape, setIsLandscape] = useState(false);

  const { width, height } = useWindowDimensions();

  // fallback: reaguj na zmianę rozmiarów okna (przydatne gdy listener nie działa)
  useEffect(() => {
    setIsLandscape(width > height);
  }, [width, height]);

  // --- ORIENTACJA: odblokuj na starcie i nasłuchuj eventów ---
  useEffect(() => {
    let subscription = null;
    const initOrientation = async () => {
      try {
        // Odblokuj orientację przy starcie (usuwa ewentualne locki ustawione przez aplikację)
        await ScreenOrientation.unlockAsync();
      } catch (e) {
        console.warn("unlockAsync failed:", e);
      }

      try {
        // Ustaw początkową wartość orientacji
        const current = await ScreenOrientation.getOrientationAsync();
        setIsLandscape(
          current === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
            current === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
        );
      } catch (e) {
        console.warn("getOrientationAsync failed:", e);
      }

      try {
        subscription = ScreenOrientation.addOrientationChangeListener((evt) => {
          const o = evt.orientationInfo.orientation;
          setIsLandscape(
            o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
              o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
          );
        });
      } catch (e) {
        console.warn("addOrientationChangeListener failed:", e);
      }
    };

    initOrientation();

    return () => {
      try {
        if (subscription) ScreenOrientation.removeOrientationChangeListener(subscription);
      } catch (e) {
        // ignore
      }
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
      "÷": "/",
      "×": "*",
      "−": "-",
      ",": ".",
      "π": "pi",
      "eˣ": "exp(",
      "x²": "^2",
      "x³": "^3",
      "xʸ": "^",
      "√x": "sqrt(",
      "∛x": "cbrt(",
      "ʸ√x": "nthRoot(",
      "ln": "log(",
      "log₁₀": "log10(",
      "sin": "sin(",
      "cos": "cos(",
      "tan": "tan(",
      "sinh": "sinh(",
      "cosh": "cosh(",
      "tanh": "tanh(",
      "x!": "factorial(",
      "+/−": "negate(",
      "%": "/100",
      "e": "e",
      "EE": "e",
      "Rand": "random()",
    };
    return mappings[label] !== undefined ? mappings[label] : label;
  };

  const handlePressMapped = (label) => {
    if (label === "AC") {
      setExpression("");
      setResult("0");
      return;
    }

    if (label === "=") {
      try {
        let expr = expression
          .replace(/÷/g, "/")
          .replace(/×/g, "*")
          .replace(/−/g, "-")
          .replace(/,/g, ".");
        expr = expr.replace(/negate\(/g, "(-1)*(");
        const evaluated = MathJS.evaluate(expr);
        setResult(String(isFinite(evaluated) ? evaluated : "Error"));
      } catch (e) {
        setResult("Error");
      }
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

  const renderPortrait = (buttons) =>
    buttons.map((row, i) => (
      <View key={`p-row-${i}`} style={styles.row}>
        {row.map((btn, j) => {
          let label;
          let flex = 1;
          if (Array.isArray(btn)) [label, flex] = btn;
          else label = btn;
          if (label === null || label === undefined) return null;
          return (
            <TouchableOpacity
              key={`p-${label}-${i}-${j}`}
              style={[
                styles.button,
                { flex },
                isOperatorLabel(label) && styles.opButton,
                ["AC", "+/−", "%"].includes(label) && styles.specialButton,
              ]}
              onPress={() => handlePressMapped(label)}
            >
              <Text style={[styles.buttonText, ["AC", "+/−", "%"].includes(label) && { color: "black" }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));

  const renderScientific = (buttons) =>
    buttons.map((row, i) => (
      <View key={`s-row-${i}`} style={styles.row}>
        {row.map((btn, j) => {
          if (btn === null || btn === undefined) {
            return <View key={`empty-${i}-${j}`} style={[styles.button, { opacity: 0 }]} />;
          }
          return (
            <TouchableOpacity
              key={`s-${btn}-${i}-${j}`}
              style={[
                styles.button,
                { flex: 1 },
                isOperatorLabel(btn) && styles.opButton,
                ["AC", "+/−", "%"].includes(btn) && styles.specialButton,
                !isOperatorLabel(btn) && isNaN(btn) && !["AC", "+/−", "%", "(", ")", "Rand", "EE", ",", "="].includes(btn) && styles.funcButton,
              ]}
              onPress={() => handlePressMapped(btn)}
            >
              <Text style={[styles.buttonText, ["AC", "+/−", "%"].includes(btn) && { color: "black" }]}>{btn}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.displayContainer}>
        <ScrollView horizontal contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }} showsHorizontalScrollIndicator={false}>
          <Text style={styles.expressionText}>{expression}</Text>
        </ScrollView>
        <Text style={styles.resultText}>{result}</Text>
      </View>

      <View style={styles.buttonsContainer}>
        {isLandscape ? renderScientific(buttonsLandscape) : renderPortrait(buttonsPortrait)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3b3b3b",
    justifyContent: "flex-end",
  },
  displayContainer: {
    backgroundColor: "#4b4b4b",
    padding: 10,
    minHeight: 120,
    justifyContent: "center",
  },
  expressionText: {
    color: "#ccc",
    fontSize: 24,
    textAlign: "right",
  },
  resultText: {
    color: "white",
    fontSize: 40,
    textAlign: "right",
    fontWeight: "600",
  },
  buttonsContainer: {
    padding: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  button: {
    backgroundColor: "#6b6b6b",
    flex: 1,
    margin: 2,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    height: 60,
  },
  opButton: {
    backgroundColor: "#f79e1b",
  },
  specialButton: {
    backgroundColor: "#a5a5a5",
  },
  funcButton: {
    backgroundColor: "#505050",
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "500",
  },
});
