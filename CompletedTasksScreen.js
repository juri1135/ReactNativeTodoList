import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { light, dark } from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from 'styled-components';
import { Feather } from '@expo/vector-icons';
function CompletedTasksScreen({ route }) {
  // Assume `todos` is passed via route.params or context
  const { todos, appTheme } = route.params;
  const [todosArray, setTodosArray] = useState([]);

  const completedTasks = todosArray.filter((todo) => todo.checked);
  const completedWork = completedTasks.filter((todo) => todo.working);
  const completedTravel = completedTasks.filter((todo) => !todo.working);
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const storedTodos = await AsyncStorage.getItem('@todos');
        if (storedTodos) {
          const todosObject = JSON.parse(storedTodos);
          const todosArray = Object.keys(todosObject).map((key) => ({
            ...todosObject[key],
            id: key,
          }));
          setTodosArray(todosArray);
        }
      } catch (error) {
        Alert.alert('Failed to load todos');
      }
    };

    loadTodos();
  }, []);
  const handleDelete = (id) => {
    Alert.alert(
      '삭제하시나요?',
      '되돌릴 수 없어요!',
      [
        {
          text: '아뇽',
          style: 'cancel',
        },
        {
          text: '녜',
          onPress: () => {
            deleteTodoAndSave(id);
            Alert.alert('수고했어요😻');
          },
        },
      ],
      { cancelable: false }
    );
  };
  const deleteTodoAndSave = async (id) => {
    try {
      const newTodos = todosArray.filter((todo) => todo.id !== id);
      setTodosArray(newTodos); // Update local state
      await saveTodosToStorage(newTodos);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete the todo.');
      console.error(error);
    }
  };

  const saveTodosToStorage = async (todos) => {
    try {
      const todosObject = todos.reduce((obj, todo) => {
        obj[todo.id] = todo;
        return obj;
      }, {});
      await AsyncStorage.setItem('@todos', JSON.stringify(todosObject));
    } catch (error) {
      Alert.alert('Error saving todos');
    }
  };

  return (
    <ThemeProvider theme={appTheme}>
      <View style={{ flex: 1, backgroundColor: appTheme.bg, padding: 8, paddingBottom: 15 }}>
        <View style={{ flex: 0.5 }}>
          <Text style={{ ...styles.header, color: appTheme === light ? light.blue : dark.blue, marginTop: 5 }}>
            작업 📚
          </Text>
          <ScrollView
            style={{
              ...styles.list,
              borderColor: appTheme === light ? light.blue : dark.blue,
            }}
          >
            {completedWork.map((todo, index) => (
              <View style={styles.todo} key={todo.id}>
                <Text style={{ color: appTheme === light ? 'black' : light.bg }}>{todo.input}</Text>
                <Feather
                  name="trash-2"
                  size={20}
                  color={appTheme === light ? 'black' : 'white'}
                  onPress={() => handleDelete(todo.id)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={{ flex: 0.5 }}>
          <Text style={{ ...styles.header, color: appTheme === light ? light.blue : dark.blue, marginTop: 5 }}>
            여행🧳
          </Text>
          <ScrollView style={{ ...styles.list, borderColor: appTheme === light ? light.blue : dark.blue }}>
            {completedTravel.map((todo, index) => (
              <View style={styles.todo} key={todo.id}>
                <Text style={{ color: appTheme === light ? 'black' : light.bg }}>{todo.input}</Text>
                <Feather
                  name="trash-2"
                  size={20}
                  color={appTheme === light ? 'black' : 'white'}
                  onPress={() => handleDelete(todo.id)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </ThemeProvider>
  );
}
const styles = StyleSheet.create({
  header: {
    fontSize: 40,
    fontWeight: '600',
    padding: 10,
  },
  list: {
    paddingLeft: 10,
    paddingTop: 5,
    borderWidth: 2, // Specify the width of the border
    borderRadius: 10, // Optional, if you want rounded corners
    marginBottom: 10, // Add space between the lists
    marginHorizontal: 10,
  },
  todo: {
    flexDirection: 'row', // Makes the children (text and icon) align in a row
    justifyContent: 'space-between', // Spaces the children from each end of the container
    alignItems: 'center', // Aligns children vertically in the center
    padding: 10, // Adds padding around the content
    fontSize: 25,
  },
});
export default CompletedTasksScreen;
