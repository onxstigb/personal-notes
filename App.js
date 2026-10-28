
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "./src/firebase";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const GREEN = "#315C46";
const CREAM = "#F7F5EF";

// LOGIN AND REGISTRATION

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registering, setRegistering] = useState(false);

  async function handleAuth() {
    if (!email.trim() || !password) {
      Alert.alert("Missing information", "Enter your email and password.");
      return;
    }

    try {
      if (registering) {
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      } else {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      }
    } catch (error) {
      Alert.alert("Account error", error.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loginBox}>
        <Text style={styles.logo}>Personal Notes</Text>
        <Text style={styles.subtitle}>
          Your thoughts, all in one place.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <Text style={styles.buttonText}>
            {registering ? "Create Account" : "Log In"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRegistering(!registering)}
          style={styles.switchButton}
        >
          <Text style={styles.linkText}>
            {registering
              ? "Already have an account? Log in"
              : "New here? Create an account"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// NOTES LIST

function NotesScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    const notesQuery = query(
      collection(db, "notes"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      notesQuery,
      (snapshot) => {
        const results = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        results.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setNotes(results);
      },
      (error) => {
        Alert.alert("Could not load notes", error.message);
      }
    );

    return unsubscribe;
  }, []);

  const displayedNotes = favoritesOnly
    ? notes.filter((note) => note.favorite === true)
    : notes;

  async function toggleFavorite(note) {
    try {
      await updateDoc(doc(db, "notes", note.id), {
        favorite: !note.favorite,
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  function confirmDelete(note) {
    Alert.alert(
      "Delete note?",
      `Delete "${note.title}" permanently?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "notes", note.id));
            } catch (error) {
              Alert.alert("Error deleting note", error.message);
            }
          },
        },
      ]
    );
  }

  function renderNote({ item }) {
    return (
      <TouchableOpacity
        style={styles.noteCard}
        onPress={() => navigation.navigate("NoteEditor", { note: item })}
      >
        <View style={styles.noteHeading}>
          <Text style={styles.noteTitle}>{item.title}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item)}>
            <Text style={styles.star}>
              {item.favorite ? "★" : "☆"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.preview} numberOfLines={3}>
          {item.content}
        </Text>

        <View style={styles.noteActions}>
          <Text style={styles.smallText}>Tap to edit</Text>
          <TouchableOpacity onPress={() => confirmDelete(item)}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>My Notes</Text>
          <Text style={styles.subtitle}>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("NoteEditor")}
        >
          <Text style={styles.buttonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFavoritesOnly(!favoritesOnly)}
      >
        <Text style={styles.filterText}>
          {favoritesOnly ? "★ Showing Favorites · Show All" :
            "☆ Show Favorites"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={displayedNotes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {favoritesOnly
              ? "No favorite notes yet."
              : "No notes yet. Create your first note!"}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

// ADD AND EDIT NOTE SCREEN

function NoteEditorScreen({ navigation, route }) {
  const existingNote = route.params?.note;
  const [title, setTitle] = useState(existingNote?.title || "");
  const [content, setContent] = useState(existingNote?.content || "");
  const [saving, setSaving] = useState(false);

  async function saveNote() {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Missing information", "Enter a title and content.");
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      if (existingNote) {
        await updateDoc(doc(db, "notes", existingNote.id), {
          title: title.trim(),
          content: content.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "notes"), {
          title: title.trim(),
          content: content.trim(),
          userId: auth.currentUser.uid,
          favorite: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not save note", error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.editor}>
        <Text style={styles.label}>Note Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Give your note a title"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <Text style={styles.label}>Content</Text>
        <TextInput
          style={[styles.input, styles.contentInput]}
          placeholder="Write your thoughts here..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={saveNote}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? "Saving..." : "Save Note"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ACCOUNT TAB

function AccountScreen() {
  const email = auth.currentUser?.email || "Unknown user";

  function handleLogout() {
    Alert.alert("Log out?", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        onPress: () => signOut(auth),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.accountBox}>
        <Text style={styles.heading}>My Account</Text>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.accountEmail}>{email}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// TAB NAVIGATION

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: GREEN,
        tabBarStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

// APP NAVIGATION

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });

    return unsubscribe;
  }, []);

  if (user === undefined) {
    return (
      <View style={styles.loading}>
        <Text>Loading Personal Notes...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="NoteEditor"
              component={NoteEditorScreen}
              options={({ route }) => ({
                title: route.params?.note ? "Edit Note" : "New Note",
              })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// STYLES

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  loginBox: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: GREEN,
    marginBottom: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: GREEN,
  },
  subtitle: {
    color: "#777777",
    marginTop: 5,
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
    color: "#333333",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: GREEN,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 22,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  switchButton: {
    padding: 16,
    alignItems: "center",
  },
  linkText: {
    color: GREEN,
    fontWeight: "600",
  },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  filterButton: {
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: "#E5EDE6",
    borderRadius: 10,
  },
  filterText: {
    color: GREEN,
    fontWeight: "600",
    textAlign: "center",
  },
  list: {
    padding: 16,
    paddingBottom: 30,
  },
  noteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  noteHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#253C2D",
    flex: 1,
  },
  star: {
    fontSize: 25,
    color: "#D99B28",
    paddingLeft: 12,
  },
  preview: {
    color: "#666666",
    marginTop: 10,
    lineHeight: 21,
  },
  noteActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  smallText: {
    fontSize: 12,
    color: "#888888",
  },
  deleteText: {
    color: "#B42318",
    fontWeight: "600",
    padding: 5,
  },
  emptyText: {
    textAlign: "center",
    color: "#777777",
    marginTop: 50,
    lineHeight: 24,
  },
  editor: {
    padding: 20,
  },
  contentInput: {
    minHeight: 220,
    marginTop: 4,
  },
  accountBox: {
    padding: 24,
  },
  accountEmail: {
    fontSize: 16,
    marginTop: 4,
    color: GREEN,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CREAM,
  },
});
