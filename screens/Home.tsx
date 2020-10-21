import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, FlatList, TextInput, TouchableOpacity } from "react-native";
import BottomSheet from "reanimated-bottom-sheet";
import { Text, View } from "../components/Themed";
import * as FileSystem from "expo-file-system";
import * as Device from "expo-device";
import * as EditCard from "../components/EditHL7";
import * as enums from "../constants/enums";
import { useTheme } from "@react-navigation/native";
import * as Parser from "../hooks/parseHL7";
import { parse } from "expo-linking";
interface IHL7File {
  id: number;
  directory: string;
  name: string;
}

const empty = {
  id: 0,
  directory: "",
  name: "",
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [filteredDataSource, setFilteredDataSource] = useState([]);
  const [masterDataSource, setMasterDataSource] = useState([]);
  const bottomSheetRef = useRef(null);
  const editBottomSheetRef = useRef(null);
  const { colors } = useTheme();
  const [hl7Raw, setHl7Raw] = useState("");
  const [filePath, setFilePath] = useState("");
  const [hl7Object, setHl7Object] = useState<IHL7File>(empty);
  const [title, setTitle] = useState("Untitled");
  const [render, setRender] = useState(false);
  const [parsedSegments, setParsedSegments] = useState(null);

  useEffect(() => {
    //console.log(parsedSegments);
  }, [render]);

  useEffect(() => {
    (async () => {
      let dir = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      state.docsList = [];
      dir.forEach(async (val, index) => {
        let directory = `${FileSystem.documentDirectory}/${val}`;
        //FileSystem.deleteAsync(directory);
        state.docsList.push({
          id: index,
          directory: directory,
          name: directory.split("~").pop().split(".")[0],
        });
        setFilteredDataSource(state.docsList);
        setMasterDataSource(state.docsList);
      });
    })();
  }, []);

  const RenderInner = (colors: any) => {
    return (
      <View style={[styles.panel, { backgroundColor: colors.border }]}>
        <View style={{ height: "100%", width: Device.modelName === "iPad" ? "50%" : "100%", backgroundColor: enums.colors.transparent }}>
          <TextInput
            style={{ height: 40, borderColor: colors.text, borderWidth: 0.2, borderRadius: 10, padding: 10, color: colors.text }}
            onChangeText={(text) => {
              setTitle(text);
            }}
            value={title}
            underlineColorAndroid={enums.colors.transparent}
            placeholder="Untitled"
            placeholderTextColor={colors.text}
          />
          <TextInput
            style={{ height: 325, borderColor: colors.text, borderWidth: 0.2, borderRadius: 10, padding: 10, color: colors.text }}
            onChangeText={(text) => {
              setHl7Raw(text);
            }}
            value={hl7Raw}
            underlineColorAndroid={enums.colors.transparent}
            placeholder="Add HL7 here"
            placeholderTextColor={colors.text}
            multiline={true}
          />
          <TouchableOpacity
            onPress={async () => {
              try {
                FileSystem.deleteAsync(filePath);
              } catch {}
              let fileUri = `${FileSystem.documentDirectory}${new Date().valueOf()}~${title}.txt`;
              await FileSystem.writeAsStringAsync(fileUri, "Hello World", {
                encoding: FileSystem.EncodingType.UTF8,
              });
              const textJson = {
                name: title,
                hl7Raw: hl7Raw,
              };
              FileSystem.writeAsStringAsync(fileUri, JSON.stringify(textJson));
              bottomSheetRef.current.snapTo(1);
            }}
          >
            <View style={[{ backgroundColor: colors.primary }, styles.panelButton]}>
              <Text style={styles.panelButtonTitle}>Save</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const RenderInnerEdit = (colors: any, parsedSegments: any) => {
    /* Object.keys(parsedSegments).forEach(function (key) {
      Object.keys(parsedSegments).forEach(function (key) {
        [key].forEach((segment: any) => {
          console.log(segment);
        });
      });
    }); */
    return (
      <View style={[styles.panel, { backgroundColor: colors.border }]}>
        <View style={{ height: "100%", width: Device.modelName === "iPad" ? "50%" : "100%", backgroundColor: enums.colors.transparent }}>
          <Text style={{ fontSize: 25, fontWeight: "700", color: colors.text, padding: 10 }}>{title}</Text>
          {/* {parsedSegments &&
            parsedSegments?.map((segment: any, index: number) => {
              <Text>{segment}</Text>;
            })} */}
          <Text>{JSON.stringify(parsedSegments)}</Text>
          <TouchableOpacity
            onPress={() => {
              bottomSheetRef.current.snapTo(0);
              editBottomSheetRef.current.snapTo(1);
            }}
          >
            <View style={[{ backgroundColor: colors.primary }, styles.panelButton]}>
              <Text style={styles.panelButtonTitle}>Edit</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const searchFilterFunction = (text: string) => {
    // Check if searched text is not blank
    if (text) {
      // Inserted text is not blank
      // Filter the masterDataSource and update FilteredDataSource
      const newData = masterDataSource.filter(function (item) {
        // Applying filter for the inserted text in search bar
        const itemData = item.title ? item.title.toUpperCase() : "".toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredDataSource(newData);
      setSearch(text);
    } else {
      // Inserted text is blank
      // Update FilteredDataSource with masterDataSource
      setFilteredDataSource(masterDataSource);
      setSearch(text);
    }
  };

  const ItemView = ({ item }) => {
    return (
      // Flat List Item
      <Text style={styles.itemStyle} onPress={() => getItem(item)}>
        {item.name}
      </Text>
    );
  };

  const ItemSeparatorView = () => {
    return (
      // Flat List Item Separator
      <View
        style={{
          height: 0.5,
          width: "100%",
          backgroundColor: "#C8C8C8",
        }}
      />
    );
  };

  const getItem = async (item: IHL7File) => {
    // Function for click on an item
    //alert("Id : " + item.id + " Title : " + item.name);
    setHl7Raw(JSON.parse(await FileSystem.readAsStringAsync(item.directory)).hl7Raw);
    setFilePath(item.directory);
    setTitle(item.directory.split("~").pop().split(".")[0]);

    setParsedSegments(Parser.parseHL7(hl7Raw));
    setRender(!render);

    console.log(parsedSegments);
    if (parsedSegments == null || parsedSegments == undefined || parsedSegments == {}) {
    } else {
      bottomSheetRef.current.snapTo(1);
      editBottomSheetRef.current.snapTo(0);
    }
  };

  const state = {
    docsList: [],
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={async () => {
            bottomSheetRef.current.snapTo(0);
          }}
        >
          <View style={[{ backgroundColor: colors.primary }, styles.panelButton]}>
            <Text style={styles.panelButtonTitle}>New</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            let dir = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
            state.docsList = [];
            dir.forEach((val, index) => {
              let directory = `${FileSystem.documentDirectory}/${val}`;
              state.docsList.push({
                id: index,
                directory: directory,
                name: directory.split("/").pop().split(".")[0],
              });
            });
            console.log(state);
            setFilteredDataSource(state.docsList);
            setMasterDataSource(state.docsList);
          }}
        >
          <Text>view</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInputStyle}
          onChangeText={(text) => searchFilterFunction(text)}
          value={search}
          underlineColorAndroid="transparent"
          placeholder="Search Here"
        />
        <FlatList
          data={filteredDataSource}
          keyExtractor={(item, index) => index.toString()}
          ItemSeparatorComponent={ItemSeparatorView}
          renderItem={ItemView}
        />
      </View>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={[Device.modelName === "iPad" ? 700 : 500, 0]}
        initialSnap={1}
        borderRadius={0}
        renderHeader={() => EditCard.RenderHeader(colors)}
        renderContent={() => RenderInner(colors)}
      />
      <BottomSheet
        ref={editBottomSheetRef}
        snapPoints={[Device.modelName === "iPad" ? 700 : 700, 0]}
        initialSnap={1}
        borderRadius={0}
        renderHeader={() => EditCard.RenderHeader(colors)}
        renderContent={() => RenderInnerEdit(colors, parsedSegments)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  itemStyle: {
    padding: 10,
  },
  textInputStyle: {
    height: 40,
    borderWidth: 1,
    paddingLeft: 20,
    margin: 5,
    borderColor: "#009688",
    backgroundColor: "#FFFFFF",
  },
  panel: {
    height: "100%",
    padding: 20,
    alignItems: "center",
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
