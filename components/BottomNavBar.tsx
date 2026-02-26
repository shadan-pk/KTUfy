import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Animated,
    Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Blue Theme ───────────────────────────────────────────────────
const C = {
    bg: 'rgba(10, 17, 40, 0.95)',
    bgSolid: '#070B1E',
    pill: '#2563EB',
    pillText: '#FFFFFF',
    inactiveIcon: '#484F58',
    border: 'rgba(71, 85, 105, 0.25)',
};

interface NavItem {
    key: string;
    label: string;
    icon: string;
}

const NAV_ITEMS: NavItem[] = [
    { key: 'Home', label: 'Home', icon: '⌂' },
    { key: 'Chatbot', label: 'AI Chat', icon: '◎' },
    { key: 'Library', label: 'Library', icon: '▤' },
    { key: 'Profile', label: 'Profile', icon: '○' },
];

interface BottomNavBarProps {
    activeRoute?: string;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeRoute }) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    // Find active index
    const activeIndex = NAV_ITEMS.findIndex(
        (item) => item.key === activeRoute
    );
    const currentIndex = activeIndex >= 0 ? activeIndex : 0;

    // Pill slide animation
    const slideAnim = useRef(new Animated.Value(currentIndex)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: currentIndex,
            useNativeDriver: true,
            damping: 18,
            stiffness: 220,
            mass: 0.8,
        }).start();
    }, [currentIndex]);

    const NAV_COUNT = NAV_ITEMS.length;
    const CONTAINER_PADDING = 6;
    const ITEM_WIDTH = (SCREEN_WIDTH - 48 - CONTAINER_PADDING * 2) / NAV_COUNT;

    const pillTranslateX = slideAnim.interpolate({
        inputRange: NAV_ITEMS.map((_, i) => i),
        outputRange: NAV_ITEMS.map((_, i) => i * ITEM_WIDTH),
    });

    const handlePress = (key: string) => {
        if (key === activeRoute) return; // Already on this screen
        navigation.navigate(key as any);
    };

    return (
        <View style={styles.container}>
            <View style={styles.navBar}>
                {/* Animated pill behind the active item */}
                <Animated.View
                    style={[
                        styles.pill,
                        {
                            width: ITEM_WIDTH,
                            transform: [{ translateX: pillTranslateX }],
                        },
                    ]}
                />

                {/* Nav items */}
                {NAV_ITEMS.map((item, index) => {
                    const isActive = index === currentIndex;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            style={[styles.navItem, { width: ITEM_WIDTH }]}
                            onPress={() => handlePress(item.key)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.icon, isActive && styles.iconActive]}>
                                {item.icon}
                            </Text>
                            {isActive && (
                                <Text style={styles.activeLabel}>{item.label}</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: C.bgSolid,
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        paddingTop: 6,
        paddingHorizontal: 24,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 21, 53, 0.9)',
        borderRadius: 20,
        padding: 6,
        position: 'relative',
    },
    pill: {
        position: 'absolute',
        top: 6,
        left: 6,
        bottom: 6,
        backgroundColor: C.pill,
        borderRadius: 16,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        zIndex: 1,
    },
    icon: {
        fontSize: 20,
        color: C.inactiveIcon,
    },
    iconActive: {
        color: C.pillText,
    },
    activeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: C.pillText,
        marginLeft: 6,
    },
});

export default BottomNavBar;
