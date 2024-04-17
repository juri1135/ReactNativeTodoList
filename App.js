import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Appearance } from 'react-native';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { ThemeProvider } from 'styled-components';
import { light, dark } from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { AntDesign, Feather, EvilIcons } from '@expo/vector-icons';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const screenHeight = Dimensions.get('window').height; // 사용자의 디바이스의 전체 화면 높이를 가져옴
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const STORAGE_KEY = '@todos';
  const [loading, setLoading] = useState(true); //loading중
  const [userName, setUserName] = useState('');
  const [checkedCount, setCheckedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const checkedWidth = totalCount === 0 ? 0 : (checkedCount / totalCount) * 100 + '%';
  const uncheckedWidth =
    totalCount === 0 ? '100%' : ((totalCount - checkedCount) / totalCount) * 100 - (20.3 / SCREEN_WIDTH) * 100 + '%';

  const renderRightActions = (dragX, key) => {
    const scale = dragX.interpolate({
      inputRange: [-50, 0],
      outputRange: [0, 0],
    });
    return (
      <Animated.View>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'red',
            justifyContent: 'center',
            alignItems: 'flex-end',
            paddingRight: 20,
            paddingVertical: 10,
            paddingHorizontal: 20,
            marginTop: 10,
            //backgroundColor: appTheme.container, // Theme container color
            borderRadius: 10,
            height: 55,
          }}
          onPress={() => deleteTodo(key)}
        >
          <Feather name="trash-2" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const changeUserName = () => {
    Alert.prompt(
      '이름 입력', // 타이틀
      '안녕하세요😺, 이름을 입력해주세요!', // 메세지
      [
        {
          text: '싫어요😿',
          style: 'cancel',
        },
        {
          text: '여기용😽',
          onPress: async (name) => {
            setUserName(name);
            await AsyncStorage.setItem('userName', name); // 이름 저장
          },
        },
      ],
      'plain-text' // 키보드 타입
    );
  };

  //!---사용자가 테마 변경할 때마다 랜더링 ===>사용자의 테마에 따라서 어플의 테마 변경-----

  const [appTheme, setAppTheme] = useState(light);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setAppTheme(colorScheme === 'dark' ? dark : light); // 시스템 테마 변경 감지
    });
    const loadUserName = async () => {
      const storedUserName = await AsyncStorage.getItem('userName');
      if (storedUserName) {
        setUserName(storedUserName);
      } else {
        // 사용자 이름이 저장되어 있지 않으면 prompt를 통해 요청
        if (!userName) {
          changeUserName();
        }
      }
    };
    loadtodo();
    loadUserName();
    return () => subscription.remove(); // 컴포넌트 언마운트 시 리스너 제거
  }, [userName, todos]);

  //!사용자가 체크박스 누를 때마다 checked 변경
  const toggleCheckbox = (key) => {
    const currentTodo = todos[key];
    const newCheckedStatus = !currentTodo.checked;

    // 현재 todos에서 변경 대상 todo를 제외한 나머지로 새 객체를 생성합니다.
    const { [key]: removed, ...remainingTodos } = todos;

    let newTodos;
    if (newCheckedStatus) {
      // 체크 상태가 true가 되면, 배열의 맨 뒤로 이동
      newTodos = { ...remainingTodos, [key]: { ...currentTodo, checked: newCheckedStatus } };
    } else {
      // 체크 상태가 false가 되면, 배열의 맨 앞으로 이동
      newTodos = { [key]: { ...currentTodo, checked: newCheckedStatus }, ...remainingTodos };
    }

    // 변경된 todos 객체를 저장하는 함수를 호출합니다.
    Savetodos(newTodos);
  };

  //!사용자가 x 누르면 todos 배열을 해당 todo key를 지운 배열로 update (상태 변경 동기화해서 그냥 원래 배열에서 key 지우면
  //! 얘네는 바뀐 걸 모름. 무조건 새로운 배열 자체를 만들어서 다시 넣어줘야)
  const deleteTodo = (key) => {
    Alert.alert('삭제하시나요?', '정말로요?😿', [
      {
        text: '녜...😿',
        onPress: async () => {
          setTodos((prevTodos) => {
            const newTodos = { ...prevTodos };
            delete newTodos[key];
            Alert.alert('삭제되었어요...😿');
            return newTodos; // 먼저 상태를 업데이트
          });
        },
      },
      {
        text: '아니용😸',
        style: 'destructive',
        onPress: () => {
          Alert.alert('야호~😻');
        },
      },
    ]);
  };

  //!-------작업 페이지, 여행 페이지 설정---------
  const [working, setWorking] = useState(true);
  const travel = () => setWorking(false);
  const work = () => setWorking(true);

  //!-----사용자가 텍스트 작성할 때마다 받아서 input에 저장해두기------------
  const [input, setInput] = useState('');
  const onChangeText = (payload) => setInput(payload);

  //!JSON.stringify를 통해서 JSON 파일을 string으로 바꿀 수 있다.
  //로컬 저장소에 todo list를 저장한다
  const Savetodos = async (todo) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todo));
      //!사용자가 check를 누르든 삭제를 하든 해서 상태가 바뀌면 저장하는데, 다른 페이지로 넘어가도 이 과정이
      //!필요해서 저장한 뒤에는 todos 배열을 다시 setting해줘야 한다. 그래야 작업->여행 페이지 갔다 와도 상태 보존
      setTodos(todo);
    } catch {
      alert('저장에 실패했습니다');
    }
  };

  //!로컬 저장소에서 todo list를 가져온다.
  //string으로 저장했기 때문에 얘네를 다시 object로 바꿔줘야 함
  //사용자가 이전에 입력한 게 없다면 s가 null이라서 parse 불가! =>null이면 따로 setting해주어야 한다
  const loadtodo = async () => {
    try {
      const s = await AsyncStorage.getItem(STORAGE_KEY);
      if (s) {
        const todos = JSON.parse(s);
        setTodos(todos);
        const total = Object.keys(todos).length;
        const checked = Object.values(todos).filter((todo) => todo.checked).length;
        setTotalCount(total);
        setCheckedCount(checked);
      } else {
        setTodos({});
        setTotalCount(0);
        setCheckedCount(0);
      }
      setLoading(false);
    } catch (e) {
      alert('저장소를 읽어들이는 데 실패했습니다');
    }
  };

  //!-----------사용자가 전송 누르면 지금까지 쌓았던 input을 todos hashmap에 저장하기----------
  const [todos, setTodos] = useState({});
  //local 저장소에 계속 동기화해야 하기 때문에 async
  const addToDo = async () => {
    if (input === '') return;
    //새로운 newToDos hashmap은 새로운 newToDos {}배열에 기존 todos 배열에다가 object를 하나 추가한다.
    //key는 Date.now()로 설정하고 value는 input(할 일), work(작업인지 여행인지)
    //const newToDos = Object.assign({}, todos, { [Date.now()]: { input, work: working } });
    //stylesheet에서 사용하는 ...방식으로도 가능!
    const newToDos = { [Date.now()]: { input, working, checked: false }, ...todos };
    //hashmap에 모든 todo 넣어주기
    setTodos(newToDos);
    //local에 저장
    await Savetodos(newToDos);
    //다음에 받을 input은 다시 ""로 초기화해주기
    setInput('');
  };

  return (
    <ThemeProvider theme={appTheme}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>🐈</Text>
          <AntDesign name="loading1" size={24} color="black" />
          <Text style={{ color: appTheme === light ? dark.bg : light.bg, marginTop: 5 }}>
            꽁꽁 얼어붙은 로딩 위로 고양이가 걸어다닙니댜
          </Text>
        </View>
      ) : (
        <View style={[styles.container, { paddingTop: screenHeight * 0.04, backgroundColor: appTheme.bg }]}>
          <StatusBar style={appTheme === light ? 'dark' : 'light'} />
          <View style={styles.header}>
            <TouchableOpacity onPress={work}>
              <Text style={{ ...styles.btnTxt, color: working ? appTheme.blue : appTheme.grey }}>작업 📚</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={travel}>
              <Text style={[styles.btnTxt, { color: !working ? appTheme.blue : appTheme.grey }]}>여행🧳</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ textAlign: 'right', marginRight: 20, marginTop: 15 }}>🐈</Text>
          <TextInput
            returnKeyType="done"
            style={{ ...styles.input, backgroundColor: appTheme === light ? '#B1B3B0' : light.bg }}
            placeholder={working ? 'What to do?' : 'Where do you want to go?'}
            value={input}
            placeholderTextColor="#565656"
            //여기서 text 바뀔 때마다 이 함수 호출 안 해주면 input 저장이 안 됨 return하기 전까지 일단 쌓아두고
            onChangeText={onChangeText}
            //return하면 그 값을 todos hashmap에 넘기는 거임
            onSubmitEditing={addToDo}
          />
          {userName === '' ? null : (
            <Text
              style={{
                textAlign: 'center', // 중앙 정렬
                color: appTheme === light ? dark.grey : light.bg,
              }}
            >
              ---------{userName}'s To-do List😺---------
              <TouchableOpacity onPress={() => changeUserName()}>
                <EvilIcons name="pencil" size={24} color={appTheme === light ? dark.bg : light.bg} />
              </TouchableOpacity>
            </Text>
          )}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { backgroundColor: appTheme.blue, width: checkedWidth }]} />
            <Text
              style={[
                styles.progressBar,
                { lignSelf: 'center', backgroundColor: appTheme === light ? 'lightgrey' : 'darkgrey' },
              ]}
            >
              🐈
            </Text>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: appTheme === light ? 'lightgrey' : 'darkgrey', width: uncheckedWidth },
              ]}
            />
          </View>
          <ScrollView>
            {Object.keys(todos).map((key) =>
              //사용자가 작업을 누르고 작성하면 그 때 working은 작업이라서 hashmap에 working이 작업으로 들어감
              //여기서 todolist를 보여줄 때 현재 있는 테마랑 같으면 보여주고 아니면 보여주지 마라
              //=>working이면 working만 보여줌
              todos[key].working === working ? (
                <GestureHandlerRootView style={{ flex: 1 }} key={key}>
                  <Swipeable renderRightActions={(dragX, key) => renderRightActions(dragX, key)}>
                    <View
                      style={{
                        ...styles.todo,
                        backgroundColor: todos[key].checked === true ? appTheme.grey : appTheme.container,
                        overflow: 'hidden', // 내부 요소가 경계를 넘어서지 않도록 설정
                      }}
                    >
                      <BouncyCheckbox
                        isChecked={todos[key].checked}
                        onPress={() => toggleCheckbox(key)}
                        size={20}
                        fillColor={appTheme === light ? '#4287F5' : '#E3AC00'}
                        unfillColor="#FFFFFF"
                        iconStyle={{
                          borderRadius: 0,
                          marginRight: -16,
                        }}
                        innerIconStyle={{
                          borderRadius: 0, // to make it a little round increase the value accordingly
                        }}
                      />
                      <Text
                        style={{
                          flex: 1,
                          textDecorationLine: todos[key].checked ? 'line-through' : 'none',
                          color: light.bg,
                          fontSize: 16,
                          fontWeight: '500',
                          textAlign: 'center',
                        }}
                      >
                        {todos[key].input}
                      </Text>
                    </View>
                  </Swipeable>
                </GestureHandlerRootView>
              ) : null
            )}
          </ScrollView>
        </View>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: StatusBar.currentHeight || 0,
  },
  header: {
    paddingTop: 20,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  btnTxt: {
    fontSize: 38,
    fontWeight: '600',
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,

    fontSize: 18,
    marginBottom: 20,
  },
  progressBarContainer: {
    marginTop: 10,
    marginBottom: 8,
    flexDirection: 'row',
    height: 20,
    borderRadius: 20,
  },
  progressBar: {
    height: '100%',
  },
  todo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    //backgroundColor: appTheme.container, // Theme container color
    borderRadius: 10,
    height: 55,
  },
});
