import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HelpScreenNavigationProp } from '../types/navigation';

interface HelpScreenProps {
  navigation: HelpScreenNavigationProp;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ navigation }) => {
  const handleContactSupport = (method: string) => {
    switch (method) {
      case 'email':
        Linking.openURL('mailto:support@ktufy.com');
        break;
      case 'phone':
        Linking.openURL('tel:+15551234567');
        break;
      case 'chat':
        Alert.alert('Live Chat', 'Opening live chat support...');
        break;
      default:
        break;
    }
  };

  const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
    const [expanded, setExpanded] = React.useState(false);

    return (
      <View style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqQuestion}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.faqQuestionText}>{question}</Text>
          <Text style={styles.faqArrow}>{expanded ? '−' : '+'}</Text>
        </TouchableOpacity>
        {expanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{answer}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          
          <View style={styles.contactCard}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContactSupport('email')}
            >
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>✉</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@ktufy.com</Text>
              </View>
              <Text style={styles.contactArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContactSupport('phone')}
            >
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>📞</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone Support</Text>
                <Text style={styles.contactValue}>+1 (555) 123-4567</Text>
              </View>
              <Text style={styles.contactArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContactSupport('chat')}
            >
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>💬</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Live Chat</Text>
                <Text style={styles.contactValue}>Available 24/7</Text>
              </View>
              <Text style={styles.contactArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqCard}>
            <FAQItem
              question="How do I reset my password?"
              answer="To reset your password, go to the login screen and tap 'Forgot Password'. Enter your email address and we'll send you a reset link."
            />
            <FAQItem
              question="How can I verify my email?"
              answer="Go to your Profile screen and tap 'Verify Email'. We'll send a verification link to your registered email address."
            />
            <FAQItem
              question="How do I update my profile information?"
              answer="Navigate to your Profile screen and tap 'Edit Profile'. You can update your name, profile picture, and other information."
            />
            <FAQItem
              question="Is my data secure?"
              answer="Yes! We use industry-standard encryption and security measures to protect your data. Your information is stored securely with Firebase."
            />
            <FAQItem
              question="How do I delete my account?"
              answer="Go to Settings > Danger Zone > Delete Account. Please note that this action is permanent and cannot be undone."
            />
            <FAQItem
              question="Can I use the app offline?"
              answer="Currently, the app requires an internet connection to function properly. Offline support is planned for a future update."
            />
          </View>
        </View>

        {/* Resources Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          
          <View style={styles.resourceCard}>
            <TouchableOpacity style={styles.resourceButton}>
              <Text style={styles.resourceButtonText}>📚 User Guide</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resourceButton}>
              <Text style={styles.resourceButtonText}>🎓 Tutorials</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resourceButton}>
              <Text style={styles.resourceButtonText}>🌐 Community Forum</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resourceButton}>
              <Text style={styles.resourceButtonText}>📝 Release Notes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>KTUfy Version 1.0.0</Text>
            <Text style={styles.appInfoText}>© 2025 KTUfy. All rights reserved.</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginLeft: 5,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  contactIconText: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#666',
  },
  contactArrow: {
    fontSize: 24,
    color: '#ccc',
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 80,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  faqArrow: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '300',
  },
  faqAnswer: {
    padding: 15,
    paddingTop: 0,
    backgroundColor: '#f9f9f9',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  resourceCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resourceButton: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
  },
  resourceButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  appInfoText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
});

export default HelpScreen;
