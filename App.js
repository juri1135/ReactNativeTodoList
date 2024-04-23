import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import CompletedTasksScreen from './CompletedTasksScreen';

const Stack = createNativeStackNavigator();
//todo 페이지 분리해서 완료된 todo만 모아서 볼 수 있는 곳도 만들기
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CompletedTasks😺" component={CompletedTasksScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
