import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/Dashboard';
import WaterScreen from '../screens/Water';
import MealsScreen from '../screens/Meals';
import WorkoutScreen from '../screens/Workout';

const Tab = createBottomTabNavigator();

const COLORS = {
  water: '#3498db',
  meals: '#e74c3c',
  workout: '#f39c12',
  dashboard: '#27ae60',
  inactive: '#bdc3c7',
};

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#ecf0f1',
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Início',
            tabBarActiveTintColor: COLORS.dashboard,
            tabBarInactiveTintColor: COLORS.inactive,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Water"
          component={WaterScreen}
          options={{
            tabBarLabel: 'Água',
            tabBarActiveTintColor: COLORS.water,
            tabBarInactiveTintColor: COLORS.inactive,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="water" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Meals"
          component={MealsScreen}
          options={{
            tabBarLabel: 'Refeições',
            tabBarActiveTintColor: COLORS.meals,
            tabBarInactiveTintColor: COLORS.inactive,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="restaurant" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Workout"
          component={WorkoutScreen}
          options={{
            tabBarLabel: 'Treinos',
            tabBarActiveTintColor: COLORS.workout,
            tabBarInactiveTintColor: COLORS.inactive,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="fitness" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
