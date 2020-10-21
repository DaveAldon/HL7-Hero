import { Text, View } from "../components/Themed";
import * as React from "react";
import { StyleSheet } from "react-native";

export const RenderHeader = (colors: any) => {
  return (
    <View style={[{ backgroundColor: colors.border }, styles.header]}>
      <View style={[{ backgroundColor: colors.border }, styles.panelHeader]}>
        <View style={[{ backgroundColor: colors.text }, styles.panelHandle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    shadowColor: "#000000",
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  panelHeader: {
    alignItems: "center",
  },
  panelHandle: {
    width: 40,
    height: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  bottomSheet: {
    height: 600,
    padding: 20,
  },
  card: {
    height: 50,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  panel: {
    height: "100%",
    padding: 20,
    alignItems: "center",
  },
  panelTitle: {
    fontSize: 27,
    height: 35,
  },
  panelSubtitle: {
    fontSize: 14,
    color: "gray",
    height: 20,
    marginVertical: 5,
  },
  panelButton: {
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  panelButtonTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
});
