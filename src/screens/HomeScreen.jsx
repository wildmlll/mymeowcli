// src/screens/HomeScreen.jsx
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { getCurrentUser } from '../services/auth';
import Note from '../components/Note';
import LoadingScreen from './LoadingScreen';

function HomeScreen() {
    const [notes, setNotes] = useState([]);
    const [user, setUser] = useState(null);
    const [newNote, setNewNote] = useState('');
    const [canPost, setCanPost] = useState(true);
    const [activeNote, setActiveNote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const currentUser = await getCurrentUser();
                if (!currentUser) {
                    throw new Error('User not authenticated');
                }
                setUser(currentUser);

                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (!userDoc.exists()) {
                    throw new Error('User data not found');
                }
                const userData = userDoc.data();
                const friends = userData?.friends || [];
                const lastPostTime = userData?.lastPostTime;

                if (lastPostTime) {
                    const lastPostDate = lastPostTime.toDate ? lastPostTime.toDate() : new Date(lastPostTime);
                    const timeDiff = (new Date() - lastPostDate) / (1000 * 60 * 60);
                    setCanPost(timeDiff >= 6);
                }

                const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
                const userNotesQuery = query(
                    collection(db, 'statuses'),
                    where('ownerId', '==', currentUser.uid),
                    where('createdAt', '>', sixHoursAgo)
                );
                const userNotesSnapshot = await getDocs(userNotesQuery);
                if (!userNotesSnapshot.empty) {
                    const userNote = userNotesSnapshot.docs[0];
                    const data = userNote.data();
                    setActiveNote({
                        id: userNote.id,
                        ...data,
                        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                    });
                }

                if (friends.length > 0) {
                    const friendsNotesQuery = query(
                        collection(db, 'statuses'),
                        where('ownerId', 'in', friends),
                        where('createdAt', '>', sixHoursAgo)
                    );
                    const querySnapshot = await getDocs(friendsNotesQuery);
                    setNotes(querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                        };
                    }));
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                if (err.code === 'failed-precondition') {
                    setError('Failed to load data due to a missing Firestore index. Please check the browser console for instructions to fix this.');
                    console.warn('Firestore index missing. To resolve:');
                    console.warn('- Go to the Firebase Console > Firestore Database > Indexes tab.');
                    console.warn('- Create a composite index for the "statuses" collection with:');
                    console.warn('  - Collection ID: statuses');
                    console.warn('  - Fields: ownerId (ascending), createdAt (ascending)');
                    console.warn('  - Query Scope: Collection');
                    console.warn('- After creating the index, refresh the app or wait for the index to build.');
                } else {
                    setError('Failed to load data. Please check your internet connection or try again later.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePostNote = async () => {
        if (!canPost || !newNote.trim()) return;
        try {
            setIsLoading(true);
            const note = {
                text: newNote,
                createdAt: new Date(),
                ownerId: user.uid,
                nickname: (await getDoc(doc(db, 'users', user.uid))).data().nickname,
            };
            const docRef = await addDoc(collection(db, 'statuses'), note);
            await setDoc(doc(db, 'users', user.uid), { lastPostTime: new Date() }, { merge: true });
            setNewNote('');
            setCanPost(false);

            setActiveNote({
                id: docRef.id,
                ...note,
                createdAt: new Date()
            });
        } catch (err) {
            console.error('Error posting note:', err);
            setError('Failed to post note. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black">
                <p className="text-red-500 text-center">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-4 safe-area-inset-top">
            <h1 className="text-4xl font-bold mb-6">Home</h1>
            <div className="w-full max-w-md flex flex-col flex-grow">
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className={`w-full p-3 rounded-lg mb-4 text-center text-white placeholder-gray-400 ${
                        canPost ? 'bg-gray-800' : 'bg-gray-600 opacity-50'
                    } no-resize`}
                    placeholder="Write a note..."
                    disabled={!canPost}
                    rows={3}
                />
                <button
                    onClick={handlePostNote}
                    className={`w-full bg-gradient-violet text-white px-6 py-3 rounded-lg font-medium ${
                        !canPost && 'opacity-50 cursor-not-allowed'
                    }`}
                    disabled={!canPost}
                >
                    {canPost ? 'Post Note' : 'Wait 6 Hours'}
                </button>
                <div className="mt-4">
                    {activeNote && (
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-center mb-2">Your Active Note</h2>
                            <Note note={activeNote} />
                        </div>
                    )}
                    {notes.map(note => (
                        <Note key={note.id} note={note} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default HomeScreen;