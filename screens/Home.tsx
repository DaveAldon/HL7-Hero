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
import { ScrollView } from "react-native-gesture-handler";
import moment from "moment";
import { useQuery, QueryCache, ReactQueryCacheProvider } from "react-query";

const queryCache = new QueryCache();

interface IHL7File {
  id: number;
  directory: string;
  name: string;
  date: string;
}

const empty = {
  id: 0,
  directory: "",
  name: "",
  date: "",
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
  const [parsedSegments, setParsedSegments] = useState([]);
  const [context, setContext] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { isLoading, error, data } = useQuery("schemaData", () =>
    fetch("https://api.github.com/repos/tannerlinsley/react-query").then((res) => res.json()),
  );

  if (error) alert(`An error occurred when retrieving the HL7 schema: ${error}`);

  useEffect(() => {
    console.log(data);
  }, [isLoading]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setContext("");
  };

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
          name: directory.split("~").pop()?.split(".")[0],
          date: directory.split("/").pop()?.split("~")[0],
        });
        setFilteredDataSource(state.docsList);
        setMasterDataSource(state.docsList);
      });
      setIsRefreshing(false);
    })();
  }, [context, isRefreshing]);

  const RenderInner = (colors: any) => {
    return (
      <View style={[styles.panel, { backgroundColor: colors.border }]}>
        <View
          style={{
            height: "100%",
            width: Device.modelName === "iPad" ? "50%" : "100%",
            backgroundColor: enums.colors.transparent,
            paddingHorizontal: 10,
          }}
        >
          <TextInput
            style={{
              height: 40,
              borderRadius: 10,
              padding: 10,
              color: colors.text,
              backgroundColor: colors.background,
              marginBottom: 5,
            }}
            onChangeText={(text) => {
              setTitle(text);
            }}
            value={title}
            underlineColorAndroid={enums.colors.transparent}
            placeholder="Untitled"
            placeholderTextColor={colors.text}
          />
          <TextInput
            style={{ height: 265, borderRadius: 10, padding: 10, color: colors.text, backgroundColor: colors.background }}
            onChangeText={(text) => {
              setHl7Raw(text);
            }}
            value={hl7Raw}
            underlineColorAndroid={enums.colors.transparent}
            placeholder="Add HL7 here"
            placeholderTextColor={colors.text}
            multiline={true}
          />
          <View style={{ paddingVertical: 5, backgroundColor: enums.colors.transparent }}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  FileSystem.deleteAsync(filePath);
                } catch {}
                let date = moment().format();
                let fileUri = `${FileSystem.documentDirectory}${date}~${title}.txt`;
                /* await FileSystem.writeAsStringAsync(fileUri, "Hello World", {
                encoding: FileSystem.EncodingType.UTF8,
              }); */
                const textJson = {
                  name: title,
                  hl7Raw: hl7Raw,
                };
                FileSystem.writeAsStringAsync(fileUri, JSON.stringify(textJson));
                bottomSheetRef.current.snapTo(1);
                setContext(fileUri);
              }}
            >
              <View style={[{ backgroundColor: colors.primary }, styles.panelButton]}>
                <Text style={styles.panelButtonTitle}>Save</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                getItem(hl7Object);
                bottomSheetRef.current.snapTo(1);
              }}
            >
              <View style={[{ backgroundColor: colors.primary }, styles.panelButton]}>
                <Text style={styles.panelButtonTitle}>View</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const RenderInnerEdit = () => {
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
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>{title}</Text>
          <ScrollView style={{ width: "100%" }}>
            {parsedSegments?.map((segments: any, index: number) => {
              return Object.keys(segments).map((segmentCategory, index) => {
                return (
                  <View style={{ backgroundColor: enums.colors.transparent }} key={index}>
                    <Text selectable style={{ marginVertical: 10, fontSize: 20, fontWeight: "200" }}>
                      {segmentCategory}
                    </Text>
                    {segments[segmentCategory].map((segment: any, indexi: number) => {
                      //if (segment.subValue)
                      return (
                        <View
                          style={{
                            borderRadius: 10,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            borderWidth: 1,
                            borderColor: colors.background,
                            backgroundColor: colors.background,
                            padding: 5,
                            marginVertical: 2,
                          }}
                          key={indexi}
                        >
                          <Text style={{ width: "50%", fontWeight: "300", fontSize: 14 }} selectable>
                            {segment.segmentName}
                          </Text>
                          <Text style={{ width: "50%", fontSize: 14 }} selectable>
                            {segment.subValue}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              });
            })}
          </ScrollView>
          {/* <Text>{JSON.stringify(parsedSegments)}</Text> */}
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
      const newData = masterDataSource.filter(function (item: IHL7File) {
        // Applying filter for the inserted text in search bar
        const itemData = item.name ? item.name.toUpperCase() : "".toUpperCase();
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

  const ItemView = ({ item }: any) => {
    return (
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text
          style={styles.itemStyle}
          onPress={() => {
            setHl7Object(item);
            getItem(item);
          }}
        >
          {item.name}
        </Text>
        <Text
          style={[styles.itemStyle, { fontWeight: "200" }]}
          onPress={() => {
            setHl7Object(item);
            getItem(item);
          }}
        >
          {`${moment(item.date).format("MM/DD/YY")}`}
        </Text>
      </View>
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
    await FileSystem.readAsStringAsync(item.directory).then((raw: string) => {
      setParsedSegments([]);
      raw = JSON.parse(raw).hl7Raw;
      setHl7Raw(raw);
      setFilePath(item.directory);
      setTitle(item.directory.split("~").pop().split(".")[0]);
      let parsedHl7 = Parser.parseHL7(raw);
      setParsedSegments([parsedHl7]);
      bottomSheetRef.current.snapTo(1);
      editBottomSheetRef.current.snapTo(0);
    });
  };

  /* useEffect(() => {
    if (parsedSegments.length !== 0) {
      bottomSheetRef.current.snapTo(1);
      editBottomSheetRef.current.snapTo(0);
    }
  }, [parsedSegments]); */

  const state = {
    docsList: [],
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {/* <TouchableOpacity
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
        </TouchableOpacity> */}
        <TextInput
          style={[styles.textInputStyle, { backgroundColor: colors.background }]}
          onChangeText={(text) => searchFilterFunction(text)}
          value={search}
          underlineColorAndroid={enums.colors.transparent}
          placeholder="Search Here"
        />
        <TouchableOpacity
          onPress={async () => {
            bottomSheetRef.current.snapTo(0);
          }}
        >
          <View style={[{ backgroundColor: colors.primary }, styles.controlButton]}>
            <Text style={styles.panelButtonTitle}>New</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <FlatList
          style={{ width: "100%" }}
          data={filteredDataSource}
          onRefresh={() => onRefresh()}
          refreshing={isRefreshing}
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
        renderContent={() => RenderInnerEdit(colors)}
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
    width: 200,
    borderRadius: 10,
    paddingLeft: 10,
    margin: 5,
  },
  controlButton: {
    height: 40,
    width: 100,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    margin: 5,
  },
  panel: {
    height: "100%",
    padding: 0,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  panelButton: {
    height: 62,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
  },
  panelButtonTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
});
