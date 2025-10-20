import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  Help: undefined;
  Chatbot: undefined;
  Ticklist: undefined;
  Library: undefined;
  Schedule: undefined;
};

export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
export type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;
export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
export type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;
export type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;
export type HelpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Help'>;
export type ChatbotScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chatbot'>;
export type TicklistScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Ticklist'>;
export type LibraryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Library'>;
export type ScheduleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Schedule'>;

export type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;
export type SignupScreenRouteProp = RouteProp<RootStackParamList, 'Signup'>;
export type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;
export type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;
export type SettingsScreenRouteProp = RouteProp<RootStackParamList, 'Settings'>;
export type HelpScreenRouteProp = RouteProp<RootStackParamList, 'Help'>;
export type ChatbotScreenRouteProp = RouteProp<RootStackParamList, 'Chatbot'>;
export type TicklistScreenRouteProp = RouteProp<RootStackParamList, 'Ticklist'>;
export type LibraryScreenRouteProp = RouteProp<RootStackParamList, 'Library'>;
export type ScheduleScreenRouteProp = RouteProp<RootStackParamList, 'Schedule'>;
