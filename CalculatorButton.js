import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function CalculatorButton({ label, flex = 1, onPress, type = "default" }) {
  const getButtonStyle = () => {
    switch (type) {
      case "operator":
        return styles.opButton;
      case "special":
        return styles.specialButton;
      case "func":
        return styles.funcButton;
      default:
        return styles.defaultButton;
    }
  };

  const getTextStyle = () => {
    if (type === "special") return { color: "black", fontSize: 18, fontWeight: "500" };
    return styles.buttonText;
  };

  return (
    <TouchableOpacity
      style={[styles.button, { flex }, getButtonStyle()]}
      onPress={() => onPress(label)}
    >
      <Text style={getTextStyle()}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    margin: 2,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    height: 60,
  },
  defaultButton: {
    backgroundColor: "#6b6b6b",
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
