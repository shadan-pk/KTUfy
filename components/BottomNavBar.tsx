import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Sparkles, BookOpen, User } from 'lucide-react-native';

import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICON_SIZE = 22;

interface NavItemDef {
    routeName: string;
    label: string;
    Icon: React.ComponentType<any>;
}

const NAV_ITEMS: NavItemDef[] = [
    { routeName: 'Home', label: 'Home', Icon: Home },
    { routeName: 'Chatbot', label: 'AI Chat', Icon: Sparkles },
    { routeName: 'Library', label: 'Library', Icon: BookOpen },
    { routeName: 'Profile', label: 'Profile', Icon: User },
];

const BottomNavBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
    const { theme } = useTheme();
    const currentIndex = state.index;
    // Hide tab bar when Chatbot is active
    const currentRouteName = state.routes[currentIndex]?.name;
    if (currentRouteName === 'Chatbot') return null;

    const slideAnim = useRef(new Animated.Value(currentIndex)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: currentIndex,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
            mass: 0.8,
        }).start();
    }, [currentIndex]);

    const NAV_COUNT = NAV_ITEMS.length;
    const BAR_H_PAD = 6;
    const BAR_INNER_PAD = 6;
    const ITEM_WIDTH = (SCREEN_WIDTH - BAR_H_PAD * 2 - BAR_INNER_PAD * 2) / NAV_COUNT;

    const pillTranslateX = slideAnim.interpolate({
        inputRange: NAV_ITEMS.map((_, i) => i),
        outputRange: NAV_ITEMS.map((_, i) => i * ITEM_WIDTH),
    });

    const handlePress = (routeName: string, index: number) => {
        if (index === currentIndex) return;
        navigation.navigate(routeName);
    };

    return (
        <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
            <View style={[styles.bar, { backgroundColor: theme.backgroundSecondary }]}>
                {/* Animated pill */}
                <Animated.View
                    style={[
                        styles.pill,
                        {
                            width: ITEM_WIDTH,
                            transform: [{ translateX: pillTranslateX }],
                            backgroundColor: theme.primary,
                        },
                    ]}
                />

                {/* Items */}
                {NAV_ITEMS.map((item, index) => {
                    const isActive = index === currentIndex;
                    const IconComp = item.Icon;
                    return (
                        <TouchableOpacity
                            key={item.routeName}
                            style={[styles.item, { width: ITEM_WIDTH }]}
                            onPress={() => handlePress(item.routeName, index)}
                            activeOpacity={0.7}
                        >
                            <IconComp
                                size={ICON_SIZE}
                                color={isActive ? '#FFFFFF' : theme.textTertiary}
                                strokeWidth={isActive ? 2.2 : 1.6}
                            />
                            {isActive && (
                                <Text style={[styles.label, { color: '#FFFFFF' }]}>{item.label}</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 6,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        padding: 6,
        position: 'relative',
    },
    pill: {
        position: 'absolute',
        top: 6,
        left: 6,
        bottom: 6,
        borderRadius: 20,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 8,
        zIndex: 1,
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default BottomNavBar;
